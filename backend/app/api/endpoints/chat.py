from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.domain import User
from app.api.deps import get_current_user
from app.services.chat import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[UUID] = None
    response_depth: Optional[str] = Field("BALANCED", description="Response depth: SIMPLE, BALANCED, or DEEP")

class ChatResponse(BaseModel):
    conversation_id: str
    user_message_id: str
    assistant_message_id: str
    response: str
    references: list = []
    emotions: list = []
    contexts: list = []
    concepts: list = []
    strategy: Optional[str] = None
    prompt_version: Optional[str] = None
    has_relevant_context: bool = False
    memories: list = []

@router.post("", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Non-streaming chat endpoint for generating complete Gita-grounded response."""
    service = ChatService(db)
    try:
        result = await service.send_message_non_streaming(
            user=current_user,
            message_text=request.message,
            conversation_id=request.conversation_id,
            response_depth=request.response_depth or "BALANCED"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )

@router.options("/stream")
async def options_stream_chat_message():
    return {}

@router.post("/stream")
async def stream_chat_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streaming chat endpoint via Server-Sent Events (SSE).
    Guarantees instant 200 OK + CORS headers before any processing.
    """
    async def safe_stream_wrapper():
        # Flush HTTP 200 OK and CORS headers immediately (< 10ms)
        yield ": ping\n\n"
        try:
            service = ChatService(db)
            async for chunk in service.stream_message(
                user=current_user,
                message_text=request.message,
                conversation_id=request.conversation_id,
                response_depth=request.response_depth or "BALANCED"
            ):
                yield chunk
        except Exception as e:
            import logging, json
            logging.getLogger("gitamitra.api").exception("Error during chat stream execution")
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        safe_stream_wrapper(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
