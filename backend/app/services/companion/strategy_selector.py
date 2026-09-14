import re
from typing import Dict, List, Any

class ResponseStrategySelector:
    """
    Selects the most suitable guidance strategy based on emotional signals,
    life context, query intent, and safety boundaries.
    """

    SCRIPTURAL_INTENT_PATTERNS = [
        r"\b(?:what does the gita say|which shloka|which verse|quote a verse|what does krishna say)\b",
        r"\b(?:explain verse|chapter \d+|gita \d+\.\d+|meaning of karma yoga|what is atman|what is gunas)\b",
        r"\b(?:explain\s+(?:sattva|rajas|tamas|the gunas|karma yoga|bhakti yoga|dhyana|atman))\b",
        r"\b(?:sattva,\s*rajas,\s*and\s*tamas|sattva, rajas and tamas|sattva rajas tamas)\b",
        r"\b(?:according to (?:the )?(?:bhagavad )?gita|in chapter \d+|teachings in chapter)\b",
        r"\b(?:does the gita (?:say|teach|support)|what is bhakti yoga|soul and body|soul vs body)\b",
        r"\b(?:purpose of human existence according to the gita|meaning of life according to the gita)\b",
        r"\b(?:violent personal revenge|violent revenge)\b",
        r"\b(?:sanskrit verse|give me (?:the |a )?(?:exact )?(?:gita )?verse|in the bhagavad gita)\b"
    ]

    IDENTITY_INTENT_PATTERNS = [
        r"\b(?:hey krishna|are you (?:shri\s*)?krishna|are you god|who are you)\b",
        r"\bkya aap krishna (?:hain|ho)\b"
    ]

    GREETING_PATTERNS = [
        r"^(?:hi|hii+|hello|namaste|pranam|hey|good\s+(?:morning|evening|afternoon)|radhe\s+radhe|jai\s+shri\s+krishna)[!\.\?\s]*$"
    ]

    @classmethod
    def select_strategy(
        cls,
        user_message: str,
        emotions: List[str],
        contexts: List[str],
        is_crisis: bool
    ) -> str:
        """
        Determines the active response strategy:
        - CRISIS
        - GREETING
        - IDENTITY
        - SCRIPTURE_FOCUSED
        - CHALLENGE_PERSPECTIVE
        - CLARIFY_AND_GUIDE
        - PRACTICAL_ACTION
        - ACKNOWLEDGE_AND_ACTION (default)
        """
        if is_crisis:
            return "CRISIS"

        lower = user_message.lower().strip()

        # Check for simple greeting (e.g. "hii", "hello", "namaste")
        for pat in cls.GREETING_PATTERNS:
            if re.search(pat, lower):
                return "GREETING"

        # Check for identity inquiry (e.g. "Are you Shri Krishna?", "Who are you?")
        for pat in cls.IDENTITY_INTENT_PATTERNS:
            if re.search(pat, lower):
                return "IDENTITY"

        # Check for direct scriptural / theoretical inquiries
        for pat in cls.SCRIPTURAL_INTENT_PATTERNS:
            if re.search(pat, lower):
                return "SCRIPTURE_FOCUSED"

        # Check for jealousy, toxic comparison, or blinding ego/anger
        if "jealousy" in emotions or ("anger" in emotions and "rage" in lower):
            return "CHALLENGE_PERSPECTIVE"

        # Check for career confusion or decision-making dilemmas
        if "confusion" in emotions or "decision-making" in contexts or "purpose" in contexts:
            if "career" in contexts or "job" in lower or "what to do with my life" in lower:
                return "CLARIFY_AND_GUIDE"

        # Check for procrastination / daily discipline
        if "discipline" in contexts or "procrastinating" in lower or "focus" in lower or "lazy" in lower:
            return "PRACTICAL_ACTION"

        # Default compassionate, action-grounded guidance for failures, fears, anxieties, general inquiries
        return "ACKNOWLEDGE_AND_ACTION"
