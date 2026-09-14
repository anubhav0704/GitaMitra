import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.embeddings import get_embedding_provider
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.models.domain import User, Memory, UserPreference
from app.services.memory.extractor_base import MemoryExtractor, ExtractedMemoryItem
from app.services.memory.llm_extractor import LLMMemoryExtractor
from app.services.memory.rule_extractor import RuleBasedMemoryExtractor
from app.services.memory.deduplicator import MemoryDeduplicator

logger = logging.getLogger(__name__)

class MemoryExtractionService:
    """
    Coordinates extraction, quality filtering, deduplication, conflict resolution,
    and storage of user memories.
    """

    def __init__(
        self,
        db: AsyncSession,
        llm_provider: Optional[LLMProvider] = None,
        extractor: Optional[MemoryExtractor] = None
    ):
        self.db = db
        self.llm = llm_provider or get_llm_provider()
        self.extractor = extractor or LLMMemoryExtractor(
            llm_provider=self.llm,
            fallback_extractor=RuleBasedMemoryExtractor()
        )
        self.embedding_provider = get_embedding_provider()

    async def is_memory_enabled_for_user(self, user: User) -> bool:
        """Checks global setting and user-specific memory toggle."""
        if not settings.MEMORY_ENABLED:
            return False

        stmt = select(UserPreference).where(UserPreference.user_id == user.id)
        result = await self.db.execute(stmt)
        pref = result.scalar_one_or_none()
        if pref and isinstance(pref.settings, dict):
            return bool(pref.settings.get("memory_enabled", True))

        return True

    async def process_turn(
        self,
        user: User,
        user_message: str,
        assistant_message: Optional[str] = None,
        conversation_id: Optional[UUID] = None,
        message_id: Optional[UUID] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> List[Memory]:
        """
        Extracts, filters, and commits new or updated long-term memories
        from a single conversation turn.
        """
        # 1. Check if memory feature is enabled
        if not await self.is_memory_enabled_for_user(user):
            logger.info(f"Memory disabled for user {user.id}; skipping extraction.")
            return []

        # 2. Extract candidate memories
        try:
            result = await self.extractor.extract(
                user_message=user_message,
                assistant_message=assistant_message,
                conversation_history=conversation_history
            )
        except Exception as e:
            logger.warning(f"Memory extraction error for user {user.id}: {e}")
            return []

        if not result.should_remember or not result.memories:
            logger.debug(f"Turn contained no memorable items for user {user.id}")
            return []

        processed_memories: List[Memory] = []
        created_count = 0
        updated_count = 0
        ignored_count = 0

        # 3. Process each candidate
        for cand in result.memories:
            # Importance threshold check
            if cand.importance < settings.MEMORY_MIN_IMPORTANCE:
                ignored_count += 1
                continue

            # Generate embedding
            cand_embedding = None
            try:
                cand_embedding = self.embedding_provider.get_embedding(cand.content)
            except Exception as emb_err:
                logger.warning(f"Failed to generate embedding for candidate memory: {emb_err}")

            # Deduplication & conflict check
            action, target_mem = await MemoryDeduplicator.resolve_candidate(
                db=self.db,
                user_id=user.id,
                candidate=cand,
                candidate_embedding=cand_embedding
            )

            now = datetime.utcnow()

            if action == 'UPDATE' and target_mem:
                # Reinforce / confirm existing memory
                target_mem.confidence = min(1.0, target_mem.confidence + 0.05)
                target_mem.updated_at = now
                target_mem.last_accessed_at = now
                if cand_embedding:
                    target_mem.embedding = cand_embedding
                updated_count += 1
                processed_memories.append(target_mem)

            elif action == 'REPLACE' and target_mem:
                # Old memory is contradicted / outdated
                target_mem.is_active = False
                target_mem.updated_at = now
                curr_meta = dict(target_mem.memory_metadata or {})
                curr_meta["status"] = "OUTDATED"
                curr_meta["invalidated_at"] = now.isoformat()
                curr_meta["invalidation_reason"] = "Contradicted by newer user statement"
                target_mem.memory_metadata = curr_meta

                # Create new active replacement memory
                new_mem = Memory(
                    user_id=user.id,
                    type=cand.type.value,
                    content=cand.content,
                    summary=cand.summary,
                    importance=cand.importance,
                    confidence=cand.confidence,
                    source_conversation_id=conversation_id,
                    source_message_id=message_id,
                    embedding=cand_embedding,
                    embedding_model=self.embedding_provider.model_name,
                    embedding_version=self.embedding_provider.version,
                    memory_metadata={"status": "ACTIVE", "replaces_id": str(target_mem.id)},
                    created_at=now,
                    updated_at=now,
                    is_active=True
                )
                self.db.add(new_mem)
                created_count += 1
                processed_memories.append(new_mem)

            else:
                # Create brand new memory
                new_mem = Memory(
                    user_id=user.id,
                    type=cand.type.value,
                    content=cand.content,
                    summary=cand.summary,
                    importance=cand.importance,
                    confidence=cand.confidence,
                    source_conversation_id=conversation_id,
                    source_message_id=message_id,
                    embedding=cand_embedding,
                    embedding_model=self.embedding_provider.model_name,
                    embedding_version=self.embedding_provider.version,
                    memory_metadata={"status": "ACTIVE"},
                    created_at=now,
                    updated_at=now,
                    is_active=True
                )
                self.db.add(new_mem)
                created_count += 1
                processed_memories.append(new_mem)

        await self.db.commit()

        logger.info(
            f"Memory extraction completed for user {user.id}: "
            f"{created_count} created, {updated_count} updated, {ignored_count} ignored."
        )

        return processed_memories
