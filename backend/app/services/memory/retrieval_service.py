import re
import math
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Set
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.embeddings import get_embedding_provider
from app.models.domain import User, Memory, UserPreference

logger = logging.getLogger(__name__)

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "chapter", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for",
    "from", "further", "gita", "bhagavad", "verse", "shloka", "sloka", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in",
    "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no",
    "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "our", "ours",
    "ourselves", "out", "over", "own", "please", "s", "same", "she", "should", "so", "some",
    "such", "t", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
    "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will",
    "with", "would", "you", "your", "yours", "yourself", "yourselves", "tell", "guide", "practical",
    "application", "explain", "meaning", "give"
}

RECALL_PATTERNS = [
    r"\b(?:remember|recall|earlier|previously|last time|last chat|previous chat|other chat|we talked|we discussed|as i (?:said|told|mentioned))\b",
    r"\b(?:my (?:interview|job|career|exam|boss|family|breakup|divorce|depression|anxiety|anger|struggle|problem|situation|issue|failure))\b"
]

class MemoryRetrievalService:
    """
    Retrieves and ranks relevant long-term memories for the authenticated user.
    Enforces cross-chat isolation: every new chat is unique, fresh, and independent.
    Memories are ONLY retrieved when the current query explicitly asks about past context
    or has demonstrable topical relevance to stored memories.
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

    @staticmethod
    def _extract_tokens(text: str) -> Set[str]:
        words = re.findall(r'[a-zA-Z]{3,}', text.lower())
        return {w for w in words if w not in STOPWORDS}

    @staticmethod
    def _has_recall_intent(text: str) -> bool:
        lower = text.lower()
        return any(bool(re.search(pat, lower)) for pat in RECALL_PATTERNS)

    async def retrieve_relevant_memories(
        self,
        user: User,
        query: str,
        top_k: Optional[int] = None,
        min_score: float = 0.50
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k active memories for the user matching the current query.
        Guarantees that new chats do NOT get polluted with unrelated memories.
        """
        if not await self.is_memory_enabled(user):
            return []

        cleaned_query = query.strip()
        if len(cleaned_query) < settings.MEMORY_MIN_QUERY_LENGTH:
            return []

        limit = top_k or self.top_k
        query_tokens = self._extract_tokens(cleaned_query)
        has_recall = self._has_recall_intent(cleaned_query)

        # 1. Fetch user's active memories
        stmt = (
            select(Memory)
            .where(
                and_(
                    Memory.user_id == user.id,
                    Memory.is_active == True
                )
            )
        )
        result = await self.db.execute(stmt)
        all_active_memories = result.scalars().all()

        if not all_active_memories:
            return []

        is_mock = self.embedding_provider.model_name.startswith("mock")
        now = datetime.utcnow()
        ranked: List[Dict[str, Any]] = []

        query_embedding = None
        if not is_mock:
            try:
                query_embedding = self.embedding_provider.get_embedding(cleaned_query)
            except Exception as e:
                logger.warning(f"Embedding error in memory retrieval: {e}")

        for mem in all_active_memories:
            mem_text = f"{mem.summary or ''} {mem.content or ''}".lower()
            mem_tokens = self._extract_tokens(mem_text)
            
            # Check for keyword overlap
            overlap = query_tokens.intersection(mem_tokens)
            keyword_score = len(overlap) / max(1, len(mem_tokens)) if mem_tokens else 0.0

            # Check semantic similarity if real embeddings are available
            sem_sim = 0.0
            if query_embedding and mem.embedding is not None:
                try:
                    # Cosine similarity between query_embedding and mem.embedding
                    dot = sum(a * b for a, b in zip(query_embedding, mem.embedding))
                    norm_a = sum(a * a for a in query_embedding) ** 0.5
                    norm_b = sum(b * b for b in mem.embedding) ** 0.5
                    if norm_a > 0 and norm_b > 0:
                        sem_sim = max(0.0, min(1.0, dot / (norm_a * norm_b)))
                except Exception:
                    sem_sim = 0.0

            # Strict relevance check:
            # Memory is ONLY relevant if:
            # 1) There is direct keyword overlap between query and memory content, OR
            # 2) User explicitly asks to recall prior context/struggles and there is some topic match, OR
            # 3) Real semantic similarity is strong (>= 0.65).
            is_relevant = False
            relevance_metric = 0.0

            if overlap:
                is_relevant = True
                relevance_metric = max(0.5, keyword_score)
            elif has_recall and (sem_sim >= 0.45 or len(query_tokens) < 3):
                is_relevant = True
                relevance_metric = max(0.5, sem_sim)
            elif not is_mock and sem_sim >= 0.65:
                is_relevant = True
                relevance_metric = sem_sim

            # If not relevant to what the user is asking right now, DO NOT retrieve!
            if not is_relevant:
                continue

            # Multi-factor score for ranking amongst relevant memories
            imp_score = min(1.0, max(0.0, mem.importance / 5.0))
            days_old = max(0.0, (now - (mem.updated_at or mem.created_at)).total_seconds() / 86400.0)
            rec_score = math.exp(-0.05 * days_old)
            conf_score = min(1.0, max(0.0, float(mem.confidence or 1.0)))

            combined_score = (
                0.50 * relevance_metric +
                0.20 * imp_score +
                0.15 * rec_score +
                0.15 * conf_score
            )

            if combined_score >= min_score:
                ranked.append({
                    "memory": mem,
                    "score": round(combined_score, 4),
                    "semantic_score": round(relevance_metric, 4),
                    "importance_score": round(imp_score, 4),
                    "recency_score": round(rec_score, 4),
                    "confidence_score": round(conf_score, 4)
                })

        # Sort by score descending
        ranked.sort(key=lambda x: x["score"], reverse=True)
        selected = ranked[:limit]

        # Touch last_accessed_at for retrieved memories
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

        lines = [
            "Relevant user background stored in memory (weave in ONLY if directly pertinent to seeker's current question):"
        ]
        for item in retrieved_items:
            mem: Memory = item["memory"]
            m_type = mem.type.capitalize()
            lines.append(f"- [{m_type}] {mem.content}")

        return "\n".join(lines)
