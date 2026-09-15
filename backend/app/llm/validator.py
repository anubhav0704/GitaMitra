import re
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

class ResponseValidator:
    """
    Enhanced ResponseValidator for GitaMitra Step 7:
    - Enforces AI identity (sanitizes deific claims like "I am Shri Krishna").
    - Enforces ethical/religious safety (blocks abuse tolerance, karma fatalism, self-harm).
    - Validates scriptural grounding against verified retrieved context.
    - Attaches 'Why this verse?' contextual rationale to verified references.
    """

    DEITY_CLAIM_PATTERNS = [
        r"\bi am krishna\b",
        r"\bi am lord krishna\b",
        r"\bi am shri krishna\b",
        r"\bi am god\b",
        r"\bmain shri krishna hoon\b",
        r"\bmain krishna hoon\b",
        r"\bmain bhagwan hoon\b",
        r"\bmain sakshat krishna hoon\b"
    ]

    UNSAFE_PATTERNS = [
        r"\btolerate abuse\b",
        r"\btolerate violence\b",
        r"\baccept abuse\b",
        r"\byour karma to be abused\b",
        r"\bdeserve punishment for failing\b",
        r"\bdo not go to the hospital\b",
        r"\bdo not seek medical\b",
        r"\bcommit suicide\b",
        r"\bhurt yourself\b"
    ]

    @classmethod
    def validate(
        cls,
        content: str,
        retrieved_verses: List[Dict[str, Any]],
        strategy: str = "ACKNOWLEDGE_AND_ACTION",
        strict: bool = True,
        query_emotions: Optional[List[str]] = None,
        query_contexts: Optional[List[str]] = None
    ) -> Tuple[bool, str, List[Dict[str, Any]], List[str]]:
        """
        Validates the generated response.
        Returns:
            is_valid (bool)
            cleaned_content (str)
            verified_references (list of reference objects with rationale)
            errors (list of error descriptions)
        """
        errors = []
        cleaned_content = content
        content_lower = content.lower()

        # 1. Identity Check: Reject and sanitize claims of being Shri Krishna
        for pat in cls.DEITY_CLAIM_PATTERNS:
            if re.search(pat, content_lower):
                errors.append("Model claimed to be Shri Krishna or a deity.")
                cleaned_content = re.sub(
                    pat,
                    "I am GitaMitra, an AI spiritual companion inspired by the Bhagavad Gita",
                    cleaned_content,
                    flags=re.IGNORECASE
                )

        # Enforce first-person perspective: clean up any second-person prompt echoing
        cleaned_content = re.sub(
            r"\bYou are GitaMitra\b",
            "I am GitaMitra",
            cleaned_content,
            flags=re.IGNORECASE
        )
        cleaned_content = re.sub(
            r"\bYou are an AI spiritual companion\b",
            "I am an AI spiritual companion",
            cleaned_content,
            flags=re.IGNORECASE
        )

        # 2. Ethical / Religious Safety Check
        for pat in cls.UNSAFE_PATTERNS:
            if re.search(pat, content_lower):
                errors.append(f"Model generated potentially harmful instruction: {pat}")
                safe_fallback = (
                    "Please prioritize your immediate physical safety and human dignity. "
                    "I cannot provide guidance that justifies harm, abuse, or self-injury. "
                    "The Bhagavad Gita teaches the sacred dignity of life and standing up against injustice. "
                    "If you are facing harm, abuse, or emotional crisis, please reach out to trusted support "
                    "or contact emergency services (112 in India, or Tele-MANAS 14416 / 1800-891-4416)."
                )
                return False, safe_fallback, [], errors

        # 3. Crisis Response Enforcement
        if strategy == "CRISIS":
            has_helpline = any(w in content_lower for w in ["14416", "1800-891-4416", "1800-599-0019", "tele-manas", "kiran", "112", "988"])
            if not has_helpline:
                helpline_notice = (
                    "\n\n**Immediate Support Resources:**\n"
                    "- **Tele-MANAS (India):** 14416 or 1800-891-4416 (24x7 Toll-free)\n"
                    "- **KIRAN Mental Health Helpline:** 1800-599-0019\n"
                    "- **National Emergency:** 112\n"
                    "- **International:** [Befrienders Worldwide](https://www.befrienders.org/) / 988 Lifeline (US/Canada)"
                )
                cleaned_content += helpline_notice

        # 4. Scripture Citations Grounding & Hallucination Defense
        retrieved_keys = set()
        for rv in retrieved_verses:
            ch = rv.get("chapter") or rv.get("chapter_number")
            v = rv.get("verse") or rv.get("verse_number")
            if ch is not None and v is not None:
                retrieved_keys.add(f"{ch}.{v}")

        # Scan for explicit citations like "2.47", "18.66", "Chapter 20"
        chapter_matches = re.findall(r"\bchapter\s+(\d+)\b", content_lower)
        for ch_num in chapter_matches:
            if int(ch_num) > 18:
                errors.append(f"Model cited non-existent Gita chapter: Chapter {ch_num}")
                cleaned_content = re.sub(
                    rf"\bchapter\s+{ch_num}\b",
                    "the Bhagavad Gita",
                    cleaned_content,
                    flags=re.IGNORECASE
                )

        explicit_verse_matches = re.findall(r"\b(\d{1,2})\.(\d{1,2})\b", content)
        for ch_s, v_s in explicit_verse_matches:
            candidate = f"{int(ch_s)}.{int(v_s)}"
            if 1 <= int(ch_s) <= 18:
                if candidate not in retrieved_keys:
                    logger.warning(f"Unretrieved or non-existent verse citation detected: {candidate}. Allowed: {retrieved_keys}")
                    errors.append(f"Unretrieved verse citation: Bhagavad Gita {candidate}")
                    if strict:
                        cleaned_content = re.sub(
                            rf"(?:Bhagavad Gita|Gita)?\s*{ch_s}\.{v_s}",
                            "traditional Gita wisdom",
                            cleaned_content
                        )

        # 5. Build Verified References ONLY for verses actually cited or explicitly requested
        verified_references = []
        if strategy not in ("IDENTITY", "CRISIS") and content:
            for rv in retrieved_verses:
                ch = rv.get("chapter") or rv.get("chapter_number")
                v = rv.get("verse") or rv.get("verse_number")
                if ch is None or v is None:
                    continue
                key = f"{ch}.{v}"

                # Check if this verse is explicitly cited in the assistant's content
                is_cited = bool(
                    re.search(rf"\b{ch}\.{v}\b", content) or
                    re.search(rf"\bchapter\s+{ch}\b[^\.\n]*?\bverse\s+{v}\b", content, re.IGNORECASE) or
                    (rv.get("sanskrit") and len(rv["sanskrit"]) > 10 and rv["sanskrit"][:15] in content)
                )

                # Or if user explicitly asked for scriptural verse and this is the top retrieved match with high relevance
                is_scripture_query = (strategy == "SCRIPTURE_FOCUSED") and (len(verified_references) == 0) and (rv.get("relevance_score", 0.0) >= 0.5)

                if is_cited or is_scripture_query:
                    topics = rv.get("topics") or []
                    concepts = rv.get("concepts") or []
                    all_tags = topics + concepts
                    tags_str = ", ".join(all_tags[:3]) if all_tags else "equanimity and right action"

                    why_text = f"Selected because this teaching addresses {tags_str}, offering guidance for mental balance and duty."
                    if "2.47" in key:
                        why_text = "Selected because it provides the classic Gita principle on focusing on effort and action while releasing anxiety over results."
                    elif "2.48" in key:
                        why_text = "Selected because it defines Yoga as Samatvam (evenness of mind in both success and failure)."
                    elif "3.35" in key or "18.47" in key:
                        why_text = "Selected because it highlights Svadharma (one's own authentic duty), directly resolving jealousy and toxic comparison."
                    elif "6.5" in key or "6.6" in key:
                        why_text = "Selected because it teaches that the mind can be either your greatest friend or your enemy depending on discipline."
                    elif "6.35" in key:
                        why_text = "Selected because it explains how the restless mind is calmed through steady practice (Abhyasa) and detachment (Vairagya)."
                    elif "18.66" in key:
                        why_text = "Selected because it offers supreme solace and refuge from overwhelming fear and guilt."

                    verified_references.append({
                        "reference": f"Bhagavad Gita {key}",
                        "chapter": ch,
                        "verse": v,
                        "sanskrit": rv.get("sanskrit", ""),
                        "translation_en": rv.get("translation_en", ""),
                        "translation_hi": rv.get("translation_hi", ""),
                        "relevance_score": rv.get("relevance_score", 0.0),
                        "why_this_verse": why_text
                    })

                    # Cap at max 2 directly cited references to keep conversation clean and agentic
                    if len(verified_references) >= 2:
                        break

        is_valid = len(errors) == 0 or (strict and len(errors) > 0)
        return is_valid, cleaned_content, verified_references, errors
