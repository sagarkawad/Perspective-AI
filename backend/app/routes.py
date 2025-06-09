from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.scrapers.article_scraper import scrape_website
from app.scrapers.clean_data import clean_scraped_data
from app.services.summarization_service import summarize_text_stream
import json
from app.services.counter_service import generate_opposite_perspective
import logging
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from app.services.related_topics import generate_related_topics
from app.services.deep_research import do_deep_research
from app.services.youtube_service import get_transcription
from app.services.chat_manager import chat_manager
from app.utils.machine_id import get_machine_id
from PyPDF2 import PdfReader
from typing import BinaryIO
import fitz
from app.services.use_credits import UserCreditManager

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


class ArticleRequest(BaseModel):
    summary: str  # summarized article text to generate opposite perspective


class ScrapURLRequest(BaseModel):
    url: str  # URL to scrape data from


# class PdfContent(BaseModel):
#     content: str


class ResearchURLRequest(BaseModel):
    url: str


class RelatedTopicsRequest(BaseModel):
    summary: str  # Ensure this matches the frontend's request


class VideoRequest(BaseModel):
    url: str


class RelatedContext(BaseModel):
    summary: str
    perspective: str
    question: str


class InitializeChatRequest(BaseModel):
    url: str
    summary: str
    perspective: str
    machine_id: Optional[str] = None
    user_id: Optional[str] = None


class ChatRequest(BaseModel):
    url: str
    question: str
    thread_id: Optional[str] = None
    machine_id: Optional[str] = None
    user_id: Optional[str] = None


class ChatHistoryRequest(BaseModel):
    url: str
    machine_id: Optional[str] = None  # Only required for chat history
    user_id: Optional[str] = None


class ArticleSessionRequest(BaseModel):
    url: str
    machine_id: Optional[str] = None
    user_id: Optional[str] = None


class CreditRequest(BaseModel):
    user_id: str


@router.post("/credits")
async def get_credits(request: CreditRequest):
    """Get user credits"""
    if not request.user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required"
        )

    credit_manager = UserCreditManager(request.user_id)
    credits = await credit_manager.get_credits()
    return {"credits": credits}


@router.post("/session")
async def get_article_session(request: ArticleSessionRequest):
    """Retrieve existing summary and perspective for a URL if previously processed, ignoring machine_id and user_id"""
    from app.db.models import ChatSession

    session = await ChatSession.filter(
        url=request.url
    ).order_by("-last_accessed").first()

    if session:
        return {"exists": True, "summary": session.summary, "perspective": session.perspective}
    return {"exists": False}


@router.post("/generate-perspective")
def generate_ai_perspective(request: ArticleRequest):
    try:

        async def generate_perspective_chunks():
            for chunk in generate_opposite_perspective(request.summary):
                if chunk:  # Only yield non-empty chunks
                    yield f"{chunk}\n"

        return StreamingResponse(
            generate_perspective_chunks(),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error("Error in generate-perspective: %s", e)
        raise HTTPException(
            status_code=500, detail="Error generating perspective")


@router.post("/scrape-and-summarize")
async def scrape_article(url: str = Form(None),
                         file: UploadFile = File(None),
                         user_id: Optional[str] = Form(None)):
    print("Received request for scrape-and-summarize")
    print(f"URL: {url}")
    print(f"File: {file}")

    try:
        # Reduce credits for article search if user is logged in and scraping was successful
        if user_id:
            credit_manager = UserCreditManager(user_id)
            await credit_manager.reduce_credit('search')

        data = None
        if url:
            print("DEBUG: Processing URL")
            data = scrape_website(url)
        elif file:
            print("DEBUG: Processing file")
            contents = await file.read()
            doc = fitz.open(stream=contents, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            data = text
        else:
            print("DEBUG: No URL or file provided")
            logger.error("No URL or file provided")
            raise HTTPException(
                status_code=400, detail="Either URL or file must be provided")

        if not data:
            logger.error("No data returned from scraping")
            raise HTTPException(
                status_code=500, detail="Error scraping the article. No data returned.")

        logger.info("Scraped data: %s", data)

        # Clean the data
        clean = clean_scraped_data(data)

        # Create a generator function that will stream the summary
        async def generate_summary_chunks():
            try:
                for chunk in summarize_text_stream({"inputs": clean}):
                    if chunk:  # Only yield non-empty chunks
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as e:
                logger.error(f"Error in stream generation: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Return as a streaming response
        return StreamingResponse(
            generate_summary_chunks(),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error("Error in scrape-and-summarize: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error processing the request: {str(e)}")


@router.post("/related-topics")
async def get_related_topics(request: RelatedTopicsRequest):
    related_topics = await generate_related_topics(request.summary)
    return {"topics": related_topics}


@router.post("/deep-research")
async def get_related_topics(request: ResearchURLRequest):
    research = await do_deep_research(request.url)
    print("research")
    print(research)
    return {"research": research}


@router.post("/analyze-video")
async def analyze_video(request: VideoRequest):
    video_text = await get_transcription(request.url)

    if video_text["status"] == "error":
        return video_text  # Directly return the error message to the frontend

    summary = await summarize_text_stream({"inputs": video_text["text"]})
    return {"status": "success", "summary": summary}


@router.post("/initialize-chat")
async def initialize_chat(request: InitializeChatRequest):
    """Initialize a new chat session."""
    return await chat_manager.initialize_chat(
        request.url,
        request.summary,
        request.perspective,
        request.machine_id,
        request.user_id,
    )


@router.post("/chat")
async def chat(request: ChatRequest):
    """Get response for a chat message."""
    return await chat_manager.get_chat_response(
        request.url,
        request.question,
        request.thread_id,
        request.machine_id,
        request.user_id,
    )


@router.post("/chat-history")
async def get_chat_history(request: ChatHistoryRequest):
    """Get chat history for the current machine or user and URL."""
    if not request.machine_id and not request.user_id:
        raise HTTPException(
            status_code=400,
            detail="Machine ID or User ID is required for chat history"
        )
    return await chat_manager.get_chat_history(
        request.url,
        request.machine_id,
        request.user_id,
    )


class HistorySaveRequest(BaseModel):
    type: str
    url: Optional[str] = None
    name: Optional[str] = None
    machine_id: Optional[str] = None
    user_id: Optional[str] = None


class HistoryRequest(BaseModel):
    machine_id: Optional[str] = None
    user_id: Optional[str] = None


@router.post("/history/save")
async def save_history(request: HistorySaveRequest):
    from app.db.models import HistoryEntry, User

    user_obj = None
    if request.user_id:
        user_obj, _ = await User.get_or_create(clerk_user_id=request.user_id)

    entry = HistoryEntry(
        type=request.type,
        url=request.url,
        name=request.name,
        machine_id=request.machine_id,
        user=user_obj,
    )
    await entry.save()
    return {"status": "ok"}


@router.post("/history")
async def load_history(request: HistoryRequest):
    from fastapi import HTTPException
    from app.db.models import HistoryEntry

    if not request.user_id and not request.machine_id:
        raise HTTPException(
            status_code=400,
            detail="machine_id or user_id required to fetch history"
        )
    qs = HistoryEntry.all()
    if request.user_id:
        qs = qs.filter(user__clerk_user_id=request.user_id)
    else:
        qs = qs.filter(machine_id=request.machine_id)
    entries = await qs.order_by("-created_at").all()
    return [
        {
            "type": e.type,
            "url": e.url,
            "name": e.name,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
