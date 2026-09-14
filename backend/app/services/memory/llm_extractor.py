import json
import logging
from typing import List, Dict, Any, Optional
from app.llm.base import LLMProvider
from app.services.memory.extractor_base import (
    MemoryExtractor,
    MemoryExtractionResult,
    ExtractedMemoryItem,
    MemoryType,
    sanitize_sensitive_content
)
from app.services.memory.rule_extractor import RuleBasedMemoryExtractor

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are the Memory Extraction engine for GitaMitra, an empathetic spiritual companion grounded in the Bhagavad Gita.
Your job is to analyze the user's latest statement and extract meaningful, persistent facts about the user's ongoing life journey.

Follow these strict rules:
1. ONLY extract information that is useful across future conversations:
   - PROFILE: Stable personal identity (profession, student status, branch, degree).
   - GOAL: Longer-term aspirations/objectives (placement prep, exam prep, startup, discipline).
   - EVENT: Important concrete milestones/setbacks (failed interview, got selected, upcoming exam date).
   - PREFERENCE: Explicit communication or language preferences (Hindi, Hinglish, concise).
   - CHALLENGE: User-reported struggles (procrastination, fear of failure, anger). Treat as contextual difficulties, never medical diagnoses.
   - CONTEXT: Important ongoing circumstances (currently searching for job, working on specific project).
2. DO NOT extract conversational filler, temporary states ("tired today", "bored"), generic philosophical questions ("what is karma?"), or polite small talk ("thanks", "ok").
3. DO NOT store passwords, credentials, tokens, or private secrets.
4. Output STRICT JSON only. No markdown fences, no conversational preamble.

JSON Schema:
{
  "should_remember": boolean,
  "memories": [
    {
      "type": "PROFILE" | "GOAL" | "EVENT" | "PREFERENCE" | "CHALLENGE" | "CONTEXT",
      "content": "Clear, 3rd-person factual summary (e.g. 'User is preparing for software placements.')",
      "summary": "Short 2-6 word title (e.g. 'Goal: Software placements')",
      "importance": integer between 1 and 5 (3=moderate, 4=important, 5=critical),
      "confidence": float between 0.0 and 1.0
    }
  ]
}

If no lasting, relevant facts are found, return:
{"should_remember": false, "memories": []}
"""

class LLMMemoryExtractor(MemoryExtractor):
    """
    LLM-powered memory extractor with schema validation and fallback to rule-based extraction.
    """

    def __init__(self, llm_provider: LLMProvider, fallback_extractor: Optional[MemoryExtractor] = None):
        self.llm = llm_provider
        self.fallback = fallback_extractor or RuleBasedMemoryExtractor()

    async def extract(
        self,
        user_message: str,
        assistant_message: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> MemoryExtractionResult:
        cleaned = user_message.strip()
        if len(cleaned) < 8:
            return MemoryExtractionResult(should_remember=False, memories=[])

        # 1. Fast path: check rule-based extractor first (0ms latency, avoids 429 rate limit on Groq)
        try:
            rule_result = await self.fallback.extract(user_message, assistant_message, conversation_history)
            if rule_result.should_remember and len(rule_result.memories) > 0:
                return rule_result
        except Exception as rule_err:
            logger.debug(f"Rule extractor check exception: {rule_err}")

        # 2. If no rule matched, invoke LLM extractor for complex / nuanced statements
        prompt = f"User Statement:\n\"{cleaned}\"\n\nExtract long-term memory items according to the rules."

        try:
            resp = await self.llm.generate(
                prompt=prompt,
                system_prompt=EXTRACTION_SYSTEM_PROMPT,
                temperature=0.1,
                max_tokens=350
            )

            raw = resp.content.strip()
            # Clean possible markdown json wrapper
            if raw.startswith("```"):
                lines = raw.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()

            parsed = json.loads(raw)
            mem_items: List[ExtractedMemoryItem] = []

            for m in parsed.get("memories", []):
                m_type_str = str(m.get("type", "")).upper()
                if m_type_str not in MemoryType.__members__:
                    continue
                content = sanitize_sensitive_content(str(m.get("content", "")).strip())
                summary = str(m.get("summary", "")).strip() or None
                importance = int(m.get("importance", 3))
                confidence = float(m.get("confidence", 0.9))

                if len(content) >= 4:
                    mem_items.append(
                        ExtractedMemoryItem(
                            type=MemoryType(m_type_str),
                            content=content,
                            summary=summary[:255] if summary else None,
                            importance=max(1, min(5, importance)),
                            confidence=max(0.0, min(1.0, confidence))
                        )
                    )

            if mem_items:
                return MemoryExtractionResult(should_remember=True, memories=mem_items)
            elif parsed.get("should_remember") is False:
                # LLM determined nothing to remember
                return MemoryExtractionResult(should_remember=False, memories=[])

        except Exception as e:
            logger.warning(f"LLM memory extraction failed ({e}). Falling back to RuleBasedMemoryExtractor.")

        # Fallback to rule-based extractor
        return await self.fallback.extract(user_message, assistant_message, conversation_history)
