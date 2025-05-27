from datetime import datetime, timedelta
import uuid
from app.services.chat_service import create_chat_service
from typing import Dict, Tuple, Optional
from fastapi import HTTPException, Depends
from app.db.models import ChatSession, ChatMessage
from app.services.voice_service import openai_voice
from tortoise.transactions import in_transaction
from tortoise import fields


class ChatManager:
    def __init__(self):
        self.chat_services: Dict[str, Tuple[any, datetime]] = {}
        self.MAX_INACTIVE_TIME = timedelta(hours=24)
        self.MAX_SESSIONS = 1000

    def cleanup_old_sessions(self):
        """Remove chat sessions that haven't been accessed recently"""
        current_time = datetime.now()
        urls_to_remove = [
            url for url, (_, last_accessed) in self.chat_services.items()
            if current_time - last_accessed > self.MAX_INACTIVE_TIME
        ]
        for url in urls_to_remove:
            del self.chat_services[url]

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

        # Create database session
        async with in_transaction() as connection:
            try:
                # Associate or create user if provided
                user = None
                if user_id:
                    from app.db.models import User

                    user_obj, _ = await User.get_or_create(
                        clerk_user_id=user_id, using_db=connection
                    )
                    user = user_obj

                # First try to get existing session
                if user:
                    existing_session = await ChatSession.filter(
                        user=user,
                        url=url,
                    ).using_db(connection).first()
                else:
                    existing_session = await ChatSession.filter(
                        machine_id=machine_id,
                        url=url,
                    ).using_db(connection).first()

                if existing_session:
                    # Update last_accessed if needed
                    existing_session.last_accessed = datetime.now()
                    await existing_session.save(using_db=connection)
                    session_id = existing_session.id
                else:
                    # Create new session only if doesn't exist
                    new_session = ChatSession(
                        url=url,
                        summary=summary,
                        perspective=perspective,
                        machine_id=machine_id,
                        user=user,
                    )
                    await new_session.save(using_db=connection)
                    session_id = new_session.id

                # Initialize/retrieve chat service
                if url not in self.chat_services:
                    chat_service = create_chat_service(summary, perspective)
                    self.chat_services[url] = (chat_service, datetime.now())

                return {"status": "existing" if existing_session else "initialized",
                        "session_id": session_id}

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
        vm: bool = True,
    ) -> dict:
        """Get response for a chat message"""
        self.cleanup_old_sessions()

        if url not in self.chat_services:
            raise HTTPException(
                status_code=404, detail="Chat session not found")

        async with in_transaction() as connection:
            try:
                # Determine session filter by user or machine ID
                if user_id:
                    session = await ChatSession.filter(
                        url=url,
                        user__clerk_user_id=user_id,
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
                session.last_accessed = datetime.utcnow()
                await session.save(using_db=connection)

                if thread_id is None:
                    thread_id = str(uuid.uuid4())

                # Store user message
                user_message = ChatMessage(
                    session_id=session.id,
                    thread_id=thread_id,
                    is_ai=0,
                    message=question
                )
                await user_message.save(using_db=connection)

                # Get AI response
                chat_service, _ = self.chat_services[url]
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

                if vm:
                    try:
                        audio = openai_voice(response.content)
                        return {"response": response.content, "thread_id": thread_id, "audio": audio}
                    except Exception as e:
                        print("err", e)
                        return e
                else:
                    return {"response": response.content, "thread_id": thread_id}
                # return {"response": response.content, "thread_id": thread_id}

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
