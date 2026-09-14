from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from pydantic import BaseModel, Field, ConfigDict

from app.core.database import get_db
from app.models.domain import User, Memory, UserPreference
from app.api.deps import get_current_user
from app.services.memory.retrieval_service import MemoryRetrievalService
from app.core.embeddings import get_embedding_provider

router = APIRouter(prefix="/memories", tags=["memories"])


# Schemas
class MemoryResponse(BaseModel):
    id: UUID
    type: str
    content: str
    summary: Optional[str] = None
    importance: int
    confidence: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_accessed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class MemoryUpdateRequest(BaseModel):
    content: Optional[str] = Field(None, min_length=2, max_length=1000)
    summary: Optional[str] = Field(None, max_length=255)
    importance: Optional[int] = Field(None, ge=1, le=5)
    type: Optional[str] = None
    is_active: Optional[bool] = None


class MemorySettingsResponse(BaseModel):
    memory_enabled: bool


class MemorySettingsUpdate(BaseModel):
    memory_enabled: bool


class MemoryDebugRequest(BaseModel):
    query: str = Field(..., min_length=2)
    top_k: int = Field(default=5, ge=1, le=20)


@router.get("", response_model=List[MemoryResponse])
async def list_memories(
    type: Optional[str] = Query(None, description="Filter by memory type (e.g. PROFILE, GOAL, EVENT)"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List memories belonging strictly to the authenticated user."""
    conditions = [Memory.user_id == current_user.id]

    if type:
        conditions.append(Memory.type == type.upper())
    if is_active is not None:
        conditions.append(Memory.is_active == is_active)

    stmt = (
        select(Memory)
        .where(and_(*conditions))
        .order_by(Memory.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    memories = result.scalars().all()

    return [
        MemoryResponse(
            id=m.id,
            type=m.type,
            content=m.content,
            summary=m.summary,
            importance=m.importance,
            confidence=m.confidence,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=m.updated_at,
            last_accessed_at=m.last_accessed_at,
            metadata=m.memory_metadata or {}
        )
        for m in memories
    ]


@router.get("/settings", response_model=MemorySettingsResponse)
async def get_memory_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve user's memory personalization toggle setting."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    enabled = True
    if pref and isinstance(pref.settings, dict):
        enabled = bool(pref.settings.get("memory_enabled", True))

    return MemorySettingsResponse(memory_enabled=enabled)


from sqlalchemy.orm.attributes import flag_modified

@router.put("/settings", response_model=MemorySettingsResponse)
async def update_memory_settings(
    request: MemorySettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's memory personalization toggle setting."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = UserPreference(user_id=current_user.id, settings={"memory_enabled": request.memory_enabled})
        db.add(pref)
    else:
        new_settings = dict(pref.settings or {})
        new_settings["memory_enabled"] = request.memory_enabled
        pref.settings = new_settings
        flag_modified(pref, "settings")

    await db.commit()
    return MemorySettingsResponse(memory_enabled=request.memory_enabled)


@router.delete("", status_code=status.HTTP_200_OK)
async def clear_all_memories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes ALL memories for the authenticated user."""
    stmt = delete(Memory).where(Memory.user_id == current_user.id)
    result = await db.execute(stmt)
    await db.commit()
    return {"message": "All memories cleared successfully", "deleted_count": result.rowcount}


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific memory item. Strictly scoped to authenticated user."""
    stmt = select(Memory).where(and_(Memory.id == memory_id, Memory.user_id == current_user.id))
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found or unauthorized"
        )

    return MemoryResponse(
        id=m.id,
        type=m.type,
        content=m.content,
        summary=m.summary,
        importance=m.importance,
        confidence=m.confidence,
        is_active=m.is_active,
        created_at=m.created_at,
        updated_at=m.updated_at,
        last_accessed_at=m.last_accessed_at,
        metadata=m.memory_metadata or {}
    )


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: UUID,
    request: MemoryUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a memory item. Strictly scoped to authenticated user."""
    stmt = select(Memory).where(and_(Memory.id == memory_id, Memory.user_id == current_user.id))
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found or unauthorized"
        )

    if request.content is not None:
        m.content = request.content
        # Re-generate embedding
        try:
            provider = get_embedding_provider()
            m.embedding = provider.get_embedding(request.content)
            m.embedding_model = provider.model_name
            m.embedding_version = provider.version
        except Exception:
            pass

    if request.summary is not None:
        m.summary = request.summary
    if request.importance is not None:
        m.importance = request.importance
    if request.type is not None:
        m.type = request.type.upper()
    if request.is_active is not None:
        m.is_active = request.is_active

    m.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(m)

    return MemoryResponse(
        id=m.id,
        type=m.type,
        content=m.content,
        summary=m.summary,
        importance=m.importance,
        confidence=m.confidence,
        is_active=m.is_active,
        created_at=m.created_at,
        updated_at=m.updated_at,
        last_accessed_at=m.last_accessed_at,
        metadata=m.memory_metadata or {}
    )


@router.delete("/{memory_id}", status_code=status.HTTP_200_OK)
async def delete_memory(
    memory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a memory item. Strictly scoped to authenticated user."""
    stmt = select(Memory).where(and_(Memory.id == memory_id, Memory.user_id == current_user.id))
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found or unauthorized"
        )

    await db.delete(m)
    await db.commit()
    return {"message": "Memory deleted successfully", "id": str(memory_id)}


@router.post("/{memory_id}/dismiss", status_code=status.HTTP_200_OK)
async def dismiss_memory(
    memory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss / deactivate a memory item without deleting it from historical records."""
    stmt = select(Memory).where(and_(Memory.id == memory_id, Memory.user_id == current_user.id))
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found or unauthorized"
        )

    m.is_active = False
    m.updated_at = datetime.utcnow()
    meta = dict(m.memory_metadata or {})
    meta["status"] = "DISMISSED"
    m.memory_metadata = meta
    await db.commit()

    return {"message": "Memory dismissed successfully", "id": str(memory_id)}


@router.post("/debug", status_code=status.HTTP_200_OK)
async def debug_memory_retrieval(
    request: MemoryDebugRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Development/Diagnostic endpoint: shows detailed candidate scoring,
    similarity weights, and reasons for memory selection.
    """
    service = MemoryRetrievalService(db)
    ranked_candidates = await service.retrieve_relevant_memories(
        user=current_user,
        query=request.query,
        top_k=request.top_k,
        min_score=0.0
    )

    debug_output = []
    for item in ranked_candidates:
        m: Memory = item["memory"]
        debug_output.append({
            "id": str(m.id),
            "type": m.type,
            "content": m.content,
            "total_score": item["score"],
            "components": {
                "semantic": item["semantic_score"],
                "importance": item["importance_score"],
                "recency": item["recency_score"],
                "confidence": item["confidence_score"]
            },
            "is_active": m.is_active,
            "last_accessed_at": m.last_accessed_at.isoformat() if m.last_accessed_at else None
        })

    return {
        "query": request.query,
        "authenticated_user_id": str(current_user.id),
        "candidates_count": len(debug_output),
        "selected_memories": debug_output
    }
