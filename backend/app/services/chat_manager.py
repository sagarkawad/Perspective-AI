from datetime import datetime, timedelta
import uuid
from app.services.chat_service import create_chat_service, ChatService
from typing import Dict, Tuple, Optional
from fastapi import HTTPException, Depends
from app.db.models import ChatSession, ChatMessage, User
from app.services.voice_service import openai_voice
from tortoise.transactions import in_transaction
from tortoise import fields
from app.services.use_credits import UserCreditManager


class ChatManager:
    def __init__(self):
        self.chat_services: Dict[str, Tuple[ChatService, datetime]] = {}
        self.cleanup_threshold = timedelta(hours=1)

    def _get_session_key(self, url: str, machine_id: Optional[str], user_id: Optional[str]) -> str:
        """Generate a unique session key based on URL and user/machine ID"""
        if user_id:
            return f"{url}:user:{user_id}"
        return f"{url}:machine:{machine_id}"

    def cleanup_old_sessions(self):
        """Remove old chat services that haven't been used in a while"""
        current_time = datetime.now()
        keys_to_remove = [
            key for key, (_, last_used) in self.chat_services.items()
            if current_time - last_used > self.cleanup_threshold
        ]
        for key in keys_to_remove:
            del self.chat_services[key]

    async def initialize_chat(
        self,
        url: str,
        summary: str,
        perspective: str,
        machine_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        """Initialize a new chat session"""
        self.cleanup_old_sessions()

        session_key = self._get_session_key(url, machine_id, user_id)

        # Create or update session in database first
        async with in_transaction() as connection:
            try:
                if user_id:

                    # First ensure the user exists
                    user, _ = await User.get_or_create(
                        clerk_user_id=user_id,
                        # Set default values for new users
                        # defaults={"credit": 100}
                    )
                    session, created = await ChatSession.get_or_create(
                        url=url,
                        user=user,
                        defaults={
                            "summary": summary,
                            "perspective": perspective,
                            "machine_id": None
                        },
                        using_db=connection
                    )
                else:
                    session, created = await ChatSession.get_or_create(
                        url=url,
                        machine_id=machine_id,
                        defaults={
                            "summary": summary,
                            "perspective": perspective,
                            "user": None
                        },
                        using_db=connection
                    )

                if not created:
                    session.summary = summary
                    session.perspective = perspective
                    await session.save(using_db=connection)

                # Create new chat service and store in memory
                chat_service = ChatService(summary, perspective)
                self.chat_services[session_key] = (
                    chat_service, datetime.now())

                return {"status": "Session initialized", "session_id": session.id}

            except Exception as e:
                await connection.rollback()
                raise e

    async def get_chat_response(
        self,
        url: str,
        question: str,
        thread_id: Optional[str] = None,
        machine_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        """Get response for a chat message"""
        self.cleanup_old_sessions()

        session_key = self._get_session_key(url, machine_id, user_id)

        async with in_transaction() as connection:
            try:
                # Determine session filter by user or machine ID
                if user_id:
                    session = await ChatSession.filter(
                        url=url,
                        user_id=user_id,
                    ).using_db(connection).first()
                else:
                    session = await ChatSession.filter(
                        url=url,
                        machine_id=machine_id,
                    ).using_db(connection).first()

                if not session:
                    raise HTTPException(
                        status_code=404, detail="Chat session not found"
                    )

                # If session exists in database but not in memory, reinitialize it
                if session_key not in self.chat_services:
                    chat_service = ChatService(
                        session.summary, session.perspective)
                    self.chat_services[session_key] = (
                        chat_service, datetime.now())

                session.last_accessed = datetime.utcnow()
                await session.save(using_db=connection)

                if thread_id is None:
                    thread_id = str(uuid.uuid4())

                # Reduce credits for user messages
                if user_id:
                    credit_manager = UserCreditManager(user_id)
                    await credit_manager.reduce_credit('message')

                # Store user message
                user_message = ChatMessage(
                    session_id=session.id,
                    thread_id=thread_id,
                    is_ai=0,
                    message=question
                )
                await user_message.save(using_db=connection)

                # Get AI response
                chat_service, _ = self.chat_services[session_key]
                self.chat_services[session_key] = (
                    chat_service, datetime.now())
                response, thread_id = await chat_service.generate_response(
                    question,
                    thread_id,
                    session_id=session.id,
                )
                # Store AI response
                ai_message = ChatMessage(
                    session_id=session.id,
                    thread_id=thread_id,
                    is_ai=1,
                    message=response.content
                )
                await ai_message.save(using_db=connection)

                return {"response": response.content, "thread_id": thread_id}

            except Exception as e:
                raise e

    async def get_chat_history(
        self,
        url: str,
        machine_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> list:
        """Get chat history for a URL by user or machine ID"""
        async with in_transaction() as connection:
            try:
                # Fetch the most recent session by user or machine
                if user_id:
                    session = await ChatSession.filter(
                        user__clerk_user_id=user_id,
                        url=url,
                    ).order_by('-last_accessed').using_db(connection).first()
                else:
                    session = await ChatSession.filter(
                        machine_id=machine_id,
                        url=url,
                    ).order_by('-last_accessed').using_db(connection).first()

                if not session:
                    return []

                messages = await ChatMessage.filter(session_id=session.id).order_by('timestamp').using_db(connection).all()

                return [
                    {
                        "isAI": msg.is_ai == 1,
                        "message": msg.message,
                        "timestamp": msg.timestamp.isoformat()
                    }
                    for msg in messages
                ]

            except Exception as e:
                raise e


# Create a singleton instance
chat_manager = ChatManager()
