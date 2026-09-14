import math
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.embeddings import get_embedding_provider
from app.models.domain import User, Memory, UserPreference

logger = logging.getLogger(__name__)

class MemoryRetrievalService:
    """
    Retrieves and ranks relevant long-term memories for the authenticated user
    using a multi-factor score (semantic similarity, importance, recency, confidence).
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_provider = get_embedding_provider()
        self.semantic_weight = settings.MEMORY_SEMANTIC_WEIGHT
        self.importance_weight = settings.MEMORY_IMPORTANCE_WEIGHT
        self.recency_weight = settings.MEMORY_RECENCY_WEIGHT
        self.confidence_weight = settings.MEMORY_CONFIDENCE_WEIGHT
        self.top_k = settings.MEMORY_TOP_K

    async def is_memory_enabled(self, user: User) -> bool:
        """Verifies if memory retrieval is enabled globally and for this user."""
        if not settings.MEMORY_ENABLED:
            return False

        stmt = select(UserPreference).where(UserPreference.user_id == user.id)
        result = await self.db.execute(stmt)
        pref = result.scalar_one_or_none()
        if pref and isinstance(pref.settings, dict):
            return bool(pref.settings.get("memory_enabled", True))

        return True

    async def retrieve_relevant_memories(
        self,
        user: User,
        query: str,
        top_k: Optional[int] = None,
        min_score: float = 0.25
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k active memories for the user matching the current query.
        Returns list of dicts with memory object and score components.
        """
        if not await self.is_memory_enabled(user):
            return []

        cleaned_query = query.strip()
        if len(cleaned_query) < settings.MEMORY_MIN_QUERY_LENGTH:
            return []

        limit = top_k or self.top_k

        # 1. Generate query embedding
        try:
            query_embedding = self.embedding_provider.get_embedding(cleaned_query)
        except Exception as e:
            logger.warning(f"Failed to generate query embedding for memory retrieval: {e}")
            return []

        # 2. Query user's active memories with pgvector distance
        # Strictly enforce user isolation: Memory.user_id == user.id
        cosine_distance = Memory.embedding.cosine_distance(query_embedding)
        stmt = (
            select(Memory, cosine_distance.label("distance"))
            .where(
                and_(
                    Memory.user_id == user.id,
                    Memory.is_active == True,
                    Memory.embedding.isnot(None)
                )
            )
            .order_by(cosine_distance)
            .limit(max(20, limit * 4))
        )

        result = await self.db.execute(stmt)
        candidates = result.all()

        if not candidates:
            # Check if there are active memories without embeddings as fallback
            fb_stmt = select(Memory).where(
                and_(
                    Memory.user_id == user.id,
                    Memory.is_active == True
                )
            ).limit(limit)
            fb_res = await self.db.execute(fb_stmt)
            fb_memories = fb_res.scalars().all()
            return [
                {
                    "memory": m,
                    "score": 0.5,
                    "semantic_score": 0.5,
                    "importance_score": m.importance / 5.0,
                    "recency_score": 1.0,
                    "confidence_score": m.confidence
                }
                for m in fb_memories
            ]

        now = datetime.utcnow()
        ranked: List[Dict[str, Any]] = []

        # 3. Calculate multi-factor relevance score
        for mem, dist in candidates:
            # Semantic similarity = 1 - cosine_distance
            sem_sim = max(0.0, 1.0 - (float(dist) if dist is not None else 1.0))

            # Importance score (normalized 0 to 1)
            imp_score = min(1.0, max(0.0, mem.importance / 5.0))

            # Recency score (exponential decay over days)
            days_old = max(0.0, (now - (mem.updated_at or mem.created_at)).total_seconds() / 86400.0)
            rec_score = math.exp(-0.05 * days_old)

            # Confidence score
            conf_score = min(1.0, max(0.0, float(mem.confidence or 1.0)))

            combined_score = (
                self.semantic_weight * sem_sim +
                self.importance_weight * imp_score +
                self.recency_weight * rec_score +
                self.confidence_weight * conf_score
            )

            if combined_score >= min_score:
                ranked.append({
                    "memory": mem,
                    "score": round(combined_score, 4),
                    "semantic_score": round(sem_sim, 4),
                    "importance_score": round(imp_score, 4),
                    "recency_score": round(rec_score, 4),
                    "confidence_score": round(conf_score, 4)
                })

        # 4. Sort by combined score descending
        ranked.sort(key=lambda x: x["score"], reverse=True)
        selected = ranked[:limit]

        # 5. Touch last_accessed_at for retrieved memories
        if selected:
            for item in selected:
                item["memory"].last_accessed_at = now
            await self.db.commit()

        return selected


class MemoryContextBuilder:
    """Formats retrieved memories into a safe, cleanly-delimited prompt block."""

    @staticmethod
    def build_user_memory_context(retrieved_items: List[Dict[str, Any]]) -> str:
        if not retrieved_items:
            return ""

        lines = ["Context about the user's ongoing journey and situation:"]
        for item in retrieved_items:
            mem: Memory = item["memory"]
            m_type = mem.type.capitalize()
            lines.append(f"- [{m_type}] {mem.content}")

        return "\n".join(lines)
