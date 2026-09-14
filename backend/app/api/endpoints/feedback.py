import uuid
from typing import Optional, Dict, Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.domain import User, MessageFeedback
from app.api.deps import get_current_user

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackCreateRequest(BaseModel):
    message_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    is_helpful: bool
    category: Optional[str] = Field(None, max_length=50) # e.g. 'verse_not_relevant', 'explanation_unclear', 'too_long', 'too_short', 'not_practical', 'inaccurate_reference', 'inappropriate_response'
    comment: Optional[str] = Field(None, max_length=1000)

class FeedbackOut(BaseModel):
    id: UUID
    message_id: Optional[UUID]
    conversation_id: Optional[UUID]
    is_helpful: bool
    category: Optional[str]
    comment: Optional[str]
    created_at: str

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: FeedbackCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Submit user feedback for an assistant response with category and optional comment."""
    feedback = MessageFeedback(
        user_id=current_user.id,
        message_id=request.message_id,
        conversation_id=request.conversation_id,
        is_helpful=request.is_helpful,
        category=request.category,
        comment=request.comment
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return {
        "status": "success",
        "id": str(feedback.id),
        "message": "Thank you for your feedback. This helps GitaMitra improve its guidance."
    }

@router.get("/user", response_model=List[Dict[str, Any]])
async def list_user_feedback(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List recent feedback submitted by the authenticated user."""
    stmt = (
        select(MessageFeedback)
        .where(MessageFeedback.user_id == current_user.id)
        .order_by(MessageFeedback.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [
        {
            "id": str(f.id),
            "message_id": str(f.message_id) if f.message_id else None,
            "conversation_id": str(f.conversation_id) if f.conversation_id else None,
            "is_helpful": f.is_helpful,
            "category": f.category,
            "comment": f.comment,
            "created_at": f.created_at.isoformat()
        }
        for f in records
    ]
