import json
import logging
import re
import uuid
from datetime import datetime
from typing import AsyncGenerator, Dict, Any, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.config import settings
from app.models.domain import User, Conversation, Message
from app.services.rag import RAGQueryService, RAGContextBuilder
from app.services.memory.retrieval_service import MemoryRetrievalService, MemoryContextBuilder
from app.services.memory.extraction_service import MemoryExtractionService
from app.services.companion.emotion_service import EmotionContextService
from app.services.companion.concept_graph import GitaConceptGraph
from app.services.companion.strategy_selector import ResponseStrategySelector
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.llm.prompt_builder import PromptBuilder, GITAMITRA_PROMPT_VERSION
from app.llm.validator import ResponseValidator

logger = logging.getLogger(__name__)

def normalize_radhe_heading(content: str, is_first_response: bool, user_language: str = "en") -> str:
    """
    Ensures that for the first response in a conversation, the sacred heading
    ('## **!! Radhe Radhe !!**' for English or '## **!! राधे राधे !!**' for Hindi)
    appears strictly once at the top of the message.
    If multiple occurrences exist, all extras are removed.
    """
    target_heading = "## **!! राधे राधे !!**" if user_language == "hi" else "## **!! Radhe Radhe !!**"
    pattern = re.compile(r'(?i)(?:#+\s*)?(?:\*\*)?!\s*!\s*(?:Radhe\s+Radhe|राधे\s*राधे)\s*!\s*!(?:\*\*)?')
    if is_first_response:
        matches = list(pattern.finditer(content))
        if len(matches) > 1:
            cleaned = pattern.sub("", content).strip()
            return f"{target_heading}\n\n{cleaned}"
        elif len(matches) == 0:
            return f"{target_heading}\n\n{content.strip()}"
        else:
            first = matches[0]
            rest = content[first.end():].strip()
            return f"{target_heading}\n\n{rest}"
    else:
        matches = list(pattern.finditer(content))
        if len(matches) > 1:
            first = matches[0]
            rest = pattern.sub("", content[first.end():]).strip()
            return content[:first.end()].strip() + "\n\n" + rest
        return content


class ChatService:
    """
    Step 7 GitaMitra ChatService:
    Orchestrates the complete spiritual companion pipeline:
    User message
    ↓
    Authentication & Conversation Context
    ↓
    Memory Retrieval (User Isolated)
    ↓
    Emotion & Life Context Analysis
    ↓
    Gita Concept Graph Identification
    ↓
    Hybrid RAG Retrieval (Gita Grounding)
    ↓
    Response Strategy Selection
    ↓
    Modular Prompt Construction
    ↓
    LLM Generation (Streaming / Non-streaming)
    ↓
    Enhanced Response Validation & 'Why this verse?'
    ↓
    Assistant Persistence
    ↓
    Post-Turn Memory Extraction
    """

    def __init__(self, db: AsyncSession, llm_provider: Optional[LLMProvider] = None):
        self.db = db
        self.llm = llm_provider or get_llm_provider()
        self.rag = RAGQueryService(db)
        self.memory_retrieval = MemoryRetrievalService(db)
        self.memory_extraction = MemoryExtractionService(db, llm_provider=self.llm)

    async def get_or_create_conversation(self, user: User, conversation_id: Optional[UUID] = None, title: Optional[str] = None) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id
            )
            result = await self.db.execute(stmt)
            conv = result.scalar_one_or_none()
            if not conv:
                raise ValueError("Conversation not found or unauthorized")
            return conv
        else:
            conv = Conversation(
                user_id=user.id,
                title=title or "New Spiritual Inquiry"
            )
            self.db.add(conv)
            await self.db.commit()
            await self.db.refresh(conv)
            return conv

    async def _get_recent_history(self, conversation_id: UUID, limit: int) -> List[Dict[str, str]]:
        stmt = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        messages = list(reversed(result.scalars().all()))
        return [{"role": m.role, "content": m.content} for m in messages]

    async def _update_conversation_title_if_needed(self, conv: Conversation, first_message: str):
        if not conv.title or conv.title in ("New Conversation", "New Spiritual Inquiry"):
            clean = first_message.strip().replace("\n", " ")
            title = clean[:35] + ("..." if len(clean) > 35 else "")
            conv.title = title
            conv.updated_at = datetime.utcnow()
            await self.db.commit()

    async def send_message_non_streaming(
        self,
        user: User,
        message_text: str,
        conversation_id: Optional[UUID] = None,
        response_depth: str = "BALANCED",
        language: str = "en"
    ) -> Dict[str, Any]:
        """Complete non-streaming message generation through Step 7 companion pipeline."""
        conv = await self.get_or_create_conversation(user, conversation_id)

        # 1. Save user message
        user_msg = Message(
            conversation_id=conv.id,
            role="user",
            content=message_text
        )
        self.db.add(user_msg)
        await self.db.commit()
        await self.db.refresh(user_msg)

        await self._update_conversation_title_if_needed(conv, message_text)

        # 2. Retrieve recent history
        history = await self._get_recent_history(conv.id, limit=settings.CHAT_HISTORY_LIMIT)

        # 3. Emotion & Context Analysis (instant CPU regex)
        emotion_data = EmotionContextService.analyze(message_text)

        # 4. Strategy Selection (fast pattern matching)
        strategy = ResponseStrategySelector.select_strategy(
            user_message=message_text,
            emotions=emotion_data["emotions"],
            contexts=emotion_data["contexts"],
            is_crisis=emotion_data["is_crisis"]
        )

        # 5. Conditional Retrieval: Skip heavy RAG & Memory retrieval for GREETING, IDENTITY, CRISIS
        if strategy in ("IDENTITY", "CRISIS", "GREETING"):
            retrieved_memories = []
            user_memory_context = None
            gita_concepts = []
            rag_result = {"results": [], "has_relevant_context": False}
            rag_context = ""
            retrieved_verses = []
        else:
            # Memory Retrieval
            retrieved_memories = await self.memory_retrieval.retrieve_relevant_memories(user=user, query=message_text)
            user_memory_context = MemoryContextBuilder.build_user_memory_context(retrieved_memories)

            # Gita Concept Identification
            gita_concepts = GitaConceptGraph.identify_concepts(
                query=message_text,
                emotions=emotion_data["emotions"],
                contexts=emotion_data["contexts"]
            )

            # Hybrid RAG retrieval
            rag_result = await self.rag.search(query=message_text, top_k=settings.RAG_TOP_K)
            rag_context = RAGContextBuilder.build_llm_context(rag_result)
            retrieved_verses = rag_result.get("results", [])

        # 8. Check if this is the first assistant response in this conversation
        asst_count_stmt = select(func.count(Message.id)).where(
            Message.conversation_id == conv.id,
            Message.role == "assistant"
        )
        asst_count = (await self.db.execute(asst_count_stmt)).scalar() or 0
        is_first_response = (asst_count == 0)

        # 9. Modular Prompt Building
        system_prompt = PromptBuilder.load_system_prompt(response_depth=response_depth)
        prompt = PromptBuilder.build_prompt(
            user_message=message_text,
            rag_context=rag_context,
            conversation_history=history[:-1],
            user_memory_context=user_memory_context,
            strategy=strategy,
            response_depth=response_depth,
            detected_emotions=emotion_data["emotions"],
            gita_concepts=gita_concepts,
            is_first_response=is_first_response,
            user_language=language
        )

        # 10. LLM Generation
        llm_resp = await self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS
        )

        # 11. Response Validation
        is_valid, cleaned_content, verified_refs, errors = ResponseValidator.validate(
            content=llm_resp.content,
            retrieved_verses=retrieved_verses,
            strategy=strategy,
            query_emotions=emotion_data["emotions"],
            query_contexts=emotion_data["contexts"]
        )

        # Ensure first response has sacred heading strictly once
        cleaned_content = normalize_radhe_heading(cleaned_content, is_first_response, language)

        # 11. Save Assistant message
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=cleaned_content
        )
        self.db.add(assistant_msg)
        conv.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(assistant_msg)

        # 12. Post-Turn Memory Extraction
        try:
            await self.memory_extraction.process_turn(
                user=user,
                user_message=message_text,
                assistant_message=cleaned_content,
                conversation_id=conv.id,
                message_id=user_msg.id,
                conversation_history=history
            )
        except Exception as mem_err:
            logger.warning(f"Memory extraction error: {mem_err}")

        mem_previews = [
            {"type": m["memory"].type, "content": m["memory"].content, "score": m["score"]}
            for m in retrieved_memories
        ]

        return {
            "conversation_id": str(conv.id),
            "user_message_id": str(user_msg.id),
            "assistant_message_id": str(assistant_msg.id),
            "response": cleaned_content,
            "references": verified_refs,
            "emotions": emotion_data["emotions"],
            "contexts": emotion_data["contexts"],
            "concepts": [c["name"] for c in gita_concepts],
            "strategy": strategy,
            "prompt_version": GITAMITRA_PROMPT_VERSION,
            "has_relevant_context": rag_result.get("has_relevant_context", False),
            "memories": mem_previews
        }

    async def stream_message(
        self,
        user: User,
        message_text: str,
        conversation_id: Optional[UUID] = None,
        response_depth: str = "BALANCED",
        language: str = "en"
    ) -> AsyncGenerator[str, None]:
        """
        Streams response chunks via Server-Sent Events (SSE).
        Emits events: init, retrieval, token, complete, error.
        """
        try:
            # Immediately yield initial ping to flush 200 OK & CORS headers to client in < 50ms
            yield ": ping\n\n"

            conv = await self.get_or_create_conversation(user, conversation_id)

            # 1. Save user message immediately
            user_msg = Message(
                conversation_id=conv.id,
                role="user",
                content=message_text
            )
            self.db.add(user_msg)
            await self.db.commit()
            await self.db.refresh(user_msg)

            await self._update_conversation_title_if_needed(conv, message_text)

            # 2. Emit initial conversation info
            yield f"event: init\ndata: {json.dumps({'conversation_id': str(conv.id), 'user_message_id': str(user_msg.id)})}\n\n"

            # 3. Retrieve recent history
            history = await self._get_recent_history(conv.id, limit=settings.CHAT_HISTORY_LIMIT)

            # 4. Emotion & Life Context Analysis (instant regex)
            emotion_data = EmotionContextService.analyze(message_text)

            # 5. Strategy Selection (fast pattern matching)
            strategy = ResponseStrategySelector.select_strategy(
                user_message=message_text,
                emotions=emotion_data["emotions"],
                contexts=emotion_data["contexts"],
                is_crisis=emotion_data["is_crisis"]
            )

            # 6. Conditional Retrieval: Skip heavy RAG & Memory retrieval for GREETING, IDENTITY, CRISIS
            if strategy in ("IDENTITY", "CRISIS", "GREETING"):
                rag_context = ""
                retrieved_verses = []
                user_memory_context = None
                retrieved_memories = []
                gita_concepts = []
                rag_result = {"results": [], "has_relevant_context": False}
            else:
                # Memory Retrieval
                retrieved_memories = await self.memory_retrieval.retrieve_relevant_memories(user=user, query=message_text)
                user_memory_context = MemoryContextBuilder.build_user_memory_context(retrieved_memories)

                # Gita Concept Graph Identification
                gita_concepts = GitaConceptGraph.identify_concepts(
                    query=message_text,
                    emotions=emotion_data["emotions"],
                    contexts=emotion_data["contexts"]
                )

                # Hybrid RAG Retrieval
                rag_result = await self.rag.search(query=message_text, top_k=settings.RAG_TOP_K)
                rag_context = RAGContextBuilder.build_llm_context(rag_result)
                retrieved_verses = rag_result.get("results", [])

            # Emit initial retrieval event with metadata preview (references only confirmed after generation)
            mem_previews = [
                {"type": m["memory"].type, "summary": m["memory"].summary or m["memory"].content[:50]}
                for m in retrieved_memories
            ]

            yield f"event: retrieval\ndata: {json.dumps({'count': len(retrieved_verses), 'references': [], 'emotions': emotion_data['emotions'], 'contexts': emotion_data['contexts'], 'concepts': [c['name'] for c in gita_concepts], 'strategy': strategy, 'memories_count': len(retrieved_memories), 'memories': mem_previews})}\n\n"

            # 8. Check if this is the first assistant response in this conversation
            asst_count_stmt = select(func.count(Message.id)).where(
                Message.conversation_id == conv.id,
                Message.role == "assistant"
            )
            asst_count = (await self.db.execute(asst_count_stmt)).scalar() or 0
            is_first_response = (asst_count == 0)

            # 9. Modular Prompt Building
            system_prompt = PromptBuilder.load_system_prompt(response_depth=response_depth)
            prompt = PromptBuilder.build_prompt(
                user_message=message_text,
                rag_context=rag_context,
                conversation_history=history[:-1],
                user_memory_context=user_memory_context,
                strategy=strategy,
                response_depth=response_depth,
                detected_emotions=emotion_data["emotions"],
                gita_concepts=gita_concepts,
                is_first_response=is_first_response,
                user_language=language
            )

            # 10. Stream tokens from LLM
            accumulated_chunks = []

            async for token in self.llm.stream(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS
            ):
                accumulated_chunks.append(token)
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

            full_generated = "".join(accumulated_chunks)

            # 11. Validate full generated response
            is_valid, cleaned_content, verified_refs, errors = ResponseValidator.validate(
                content=full_generated,
                retrieved_verses=retrieved_verses,
                strategy=strategy,
                query_emotions=emotion_data["emotions"],
                query_contexts=emotion_data["contexts"]
            )

            # Guarantee first response preserves sacred greeting heading strictly once
            cleaned_content = normalize_radhe_heading(cleaned_content, is_first_response, language)

            # 12. Persist assistant message
            assistant_msg = Message(
                conversation_id=conv.id,
                role="assistant",
                content=cleaned_content
            )
            self.db.add(assistant_msg)
            conv.updated_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(assistant_msg)

            # 13. Trigger Post-Turn Memory Extraction
            try:
                await self.memory_extraction.process_turn(
                    user=user,
                    user_message=message_text,
                    assistant_message=cleaned_content,
                    conversation_id=conv.id,
                    message_id=user_msg.id,
                    conversation_history=history
                )
            except Exception as mem_err:
                logger.warning(f"Memory extraction error in stream: {mem_err}")

            # 14. Emit complete event
            complete_payload = {
                "done": True,
                "conversation_id": str(conv.id),
                "assistant_message_id": str(assistant_msg.id),
                "references": verified_refs,
                "emotions": emotion_data["emotions"],
                "strategy": strategy,
                "has_relevant_context": rag_result.get("has_relevant_context", False),
                "memories_count": len(retrieved_memories)
            }
            yield f"event: complete\ndata: {json.dumps(complete_payload)}\n\n"

        except Exception as e:
            logger.exception("Error during chat stream processing")
            error_payload = {"error": str(e)}
            yield f"event: error\ndata: {json.dumps(error_payload)}\n\n"
