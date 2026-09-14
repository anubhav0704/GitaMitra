import re
from datetime import datetime
from typing import List, Tuple, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Memory
from app.services.memory.extractor_base import ExtractedMemoryItem
from app.core.config import settings

class MemoryDeduplicator:
    """
    Handles deduplication, reinforcement, and contradiction/invalidation
    for candidate memories against a user's active memory store.
    """

    CONTRADICTION_KEYWORDS = [
        "not anymore", "no longer", "stopped", "quit", "decided not to",
        "changed my mind", "cancelled", "gave up on"
    ]

    @staticmethod
    def _is_contradiction(candidate_text: str, existing_text: str) -> bool:
        """Heuristic check whether a new memory contradicts an existing one."""
        cand_lower = candidate_text.lower()
        exist_lower = existing_text.lower()

        # Check if candidate contains negative keywords regarding existing topics
        has_negative = any(kw in cand_lower for kw in MemoryDeduplicator.CONTRADICTION_KEYWORDS)
        if has_negative:
            # Check overlap of key subject words (excluding stop words)
            cand_words = set(re.findall(r'\b[a-z0-9]{3,}\b', cand_lower))
            exist_words = set(re.findall(r'\b[a-z0-9]{3,}\b', exist_lower))
            stop_words = {"user", "the", "and", "for", "with", "preparing", "anymore", "not", "any"}
            cand_words -= stop_words
            exist_words -= stop_words
            overlap = cand_words.intersection(exist_words)
            if len(overlap) >= 1:
                return True

        return False

    @staticmethod
    def _calculate_text_similarity(text1: str, text2: str) -> float:
        """Computes Jaccard word-level similarity as a secondary check."""
        words1 = set(re.findall(r'\b[a-z0-9]{3,}\b', text1.lower()))
        words2 = set(re.findall(r'\b[a-z0-9]{3,}\b', text2.lower()))
        if not words1 or not words2:
            return 0.0
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        return intersection / union if union > 0 else 0.0

    @classmethod
    async def resolve_candidate(
        cls,
        db: AsyncSession,
        user_id,
        candidate: ExtractedMemoryItem,
        candidate_embedding: Optional[List[float]] = None
    ) -> Tuple[str, Optional[Memory]]:
        """
        Evaluates candidate memory against active memories of the same user.
        Returns:
            action: 'CREATE' | 'UPDATE' | 'REPLACE'
            target_memory: existing Memory if action is 'UPDATE' or 'REPLACE', else None
        """
        # Query ALL active memories of the user
        stmt = select(Memory).where(
            and_(
                Memory.user_id == user_id,
                Memory.is_active == True
            )
        )
        result = await db.execute(stmt)
        active_memories = result.scalars().all()

        # 1. Check for contradiction / invalidation across any active memory
        for mem in active_memories:
            if cls._is_contradiction(candidate.content, mem.content):
                return 'REPLACE', mem

        # 2. Check for deduplication / reinforcement against same-type memories
        for mem in active_memories:
            if mem.type == candidate.type.value:
                # Semantic vector similarity
                if candidate_embedding and mem.embedding is not None:
                    try:
                        dot = sum(a * b for a, b in zip(candidate_embedding, mem.embedding))
                        if dot >= 0.70:
                            return 'UPDATE', mem
                    except Exception:
                        pass

                # Text-level overlap fallback
                sim = cls._calculate_text_similarity(candidate.content, mem.content)
                if sim >= 0.50:
                    return 'UPDATE', mem

        return 'CREATE', None
