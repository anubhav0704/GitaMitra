import re
from typing import List, Dict, Any, Optional
from app.services.memory.extractor_base import (
    MemoryExtractor,
    MemoryExtractionResult,
    ExtractedMemoryItem,
    MemoryType,
    sanitize_sensitive_content
)


class RuleBasedMemoryExtractor(MemoryExtractor):
    """
    Deterministic rule and pattern-based memory extractor.
    Provides fast, reproducible extraction and serves as a reliable fallback.
    """

    FILLER_PATTERNS = [
        r'^(?:hi|hello|hey|greetings|namaste|radhe radhe|hare krishna)\b',
        r'^(?:ok|okay|thanks|thank you|cool|got it|understood|sure|fine|alright|yes|no)\b',
        r'^(?:what is|who is|explain|tell me about|define)\s+(?:karma|dharma|atman|yoga|brahman|krishna|arjuna)\b',
        r'^(?:i\'?m|i am)\s+(?:tired|bored|hungry|sleepy|sleepy today|fine|lazy)\b'
    ]

    async def extract(
        self,
        user_message: str,
        assistant_message: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> MemoryExtractionResult:
        cleaned = user_message.strip()
        cleaned_lower = cleaned.lower()

        # 1. Reject trivial / filler inputs
        if len(cleaned) < 8:
            return MemoryExtractionResult(should_remember=False, memories=[])

        for pattern in self.FILLER_PATTERNS:
            if re.search(pattern, cleaned_lower):
                if len(cleaned.split()) <= 7:
                    return MemoryExtractionResult(should_remember=False, memories=[])

        memories: List[ExtractedMemoryItem] = []

        # 2. Extract PROFILE (Student, Profession, Degree, Background)
        # Matches: "final-year computer science student", "mechanical engineering student", "medical student", "software engineer"
        profile_patterns = [
            r'((?:first|second|third|final)[-\s]year\s+(?:computer science\s+)?student)',
            r'((?:mechanical|civil|electrical|chemical|computer science|software)?\s*engineering student)',
            r'(medical student)',
            r'(software engineer|developer|designer|doctor|architect)'
        ]
        for p_pat in profile_patterns:
            p_match = re.search(p_pat, cleaned_lower)
            if p_match:
                desc = p_match.group(1).strip()
                memories.append(
                    ExtractedMemoryItem(
                        type=MemoryType.PROFILE,
                        content=sanitize_sensitive_content(f"User is a {desc}."),
                        summary=f"Role: {desc.capitalize()}",
                        importance=4,
                        confidence=0.95
                    )
                )
                break

        # 3. Extract GOAL (Placement prep, GATE, Exams, Ambitions, Startup)
        # Matches: "preparing for software placements", "preparing for GATE", "working towards launching our tech startup", "building my own educational startup"
        goal_match = re.search(
            r'(?:preparing for|studying for|aiming for|planning to|working towards launching|working towards|working on building|building my own|building our)\s+([a-z0-9\s\-]+?)(?:\.|\,|$|and\s+i|and\s+studying|but\s+i|by\s+[a-z]+)',
            cleaned_lower
        )
        if goal_match:
            goal_target = goal_match.group(1).strip()
            if 2 < len(goal_target) < 60 and not goal_target.startswith("the "):
                memories.append(
                    ExtractedMemoryItem(
                        type=MemoryType.GOAL,
                        content=sanitize_sensitive_content(f"User is preparing for {goal_target}."),
                        summary=f"Goal: Preparing for {goal_target}",
                        importance=4,
                        confidence=0.90
                    )
                )

        # Invalidation / change of goal: "decided not to prepare for GATE anymore"
        inval_match = re.search(
            r'(?:decided not to|no longer|stopped|cancelled|gave up on)\s+(?:prepare for|studying for|aiming for)?\s*([a-z0-9\s\-]+?)\s+(?:anymore|any longer)',
            cleaned_lower
        )
        if inval_match:
            inval_target = inval_match.group(1).strip()
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.GOAL,
                    content=sanitize_sensitive_content(f"User decided not to prepare for {inval_target} anymore."),
                    summary=f"Goal Cancelled: {inval_target}",
                    importance=4,
                    confidence=0.95
                )
            )

        # 4. Extract EVENT (Recent failures, upcoming exams/interviews, selections, funding)
        # Setbacks
        event_fail_match = re.search(
            r'(?:i\s+)?(?:failed|couldn\'?t clear|rejected from|couldn\'?t secure|lost)\s+(?:my\s+|our\s+)?([a-z0-9\s\-]+?)(?:\.|\,|$|today|yesterday|recently|and\s+i)',
            cleaned_lower
        )
        if event_fail_match:
            item = event_fail_match.group(1).strip()
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.EVENT,
                    content=sanitize_sensitive_content(f"User recently experienced a setback: failed {item}."),
                    summary=f"Event: Failed {item}",
                    importance=4,
                    confidence=0.92
                )
            )

        # Exam results setback: "mock exam results were very low"
        mock_result_match = re.search(
            r'([a-z0-9\s\-]+?(?:exam|test|interview))\s+results?\s+(?:were|was)\s+(?:very low|poor|bad|disappointing)',
            cleaned_lower
        )
        if mock_result_match:
            res_item = mock_result_match.group(1).strip()
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.EVENT,
                    content=sanitize_sensitive_content(f"User received poor {res_item} results."),
                    summary=f"Event: Poor {res_item} results",
                    importance=4,
                    confidence=0.90
                )
            )

        # Success / Selection: "got selected for my dream internship today"
        selection_match = re.search(
            r'(?:got selected for|selected for|cleared|received an offer from|cracked)\s+([a-z0-9\s\-]+?)(?:\.|\,|$|today|yesterday)',
            cleaned_lower
        )
        if selection_match:
            sel_item = selection_match.group(1).strip()
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.EVENT,
                    content=sanitize_sensitive_content(f"User was selected for {sel_item}."),
                    summary=f"Event: Selected for {sel_item}",
                    importance=4,
                    confidence=0.95
                )
            )

        # Upcoming milestones: "have another interview next week", "final defense exam next week"
        event_upcoming_match = re.search(
            r'(?:i have|got|scheduled|my)\s+(?:an?|another|my)?\s*([a-z0-9\s\-]+?(?:interview|exam|test|defense exam|presentation|meeting))\s+(next week|tomorrow|next month|on [a-z]+)',
            cleaned_lower
        )
        if event_upcoming_match:
            ev_name = event_upcoming_match.group(1).strip()
            ev_time = event_upcoming_match.group(2).strip()
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.EVENT,
                    content=sanitize_sensitive_content(f"User has an upcoming {ev_name} {ev_time}."),
                    summary=f"Upcoming: {ev_name} {ev_time}",
                    importance=4,
                    confidence=0.90
                )
            )

        # 5. Extract PREFERENCE (Communication, language, answer style)
        if "hindi" in cleaned_lower:
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.PREFERENCE,
                    content="User prefers responses in Hindi.",
                    summary="Preference: Hindi language",
                    importance=4,
                    confidence=0.95
                )
            )
        elif "hinglish" in cleaned_lower:
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.PREFERENCE,
                    content="User prefers responses in Hinglish.",
                    summary="Preference: Hinglish language",
                    importance=4,
                    confidence=0.95
                )
            )
        if "concise" in cleaned_lower or "short answers" in cleaned_lower:
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.PREFERENCE,
                    content="User prefers concise and direct responses.",
                    summary="Preference: Concise style",
                    importance=3,
                    confidence=0.90
                )
            )

        # 6. Extract CHALLENGE (Contextual difficulty: procrastination, anger, fear of failure, overthinking)
        challenge_match = re.search(
            r'(?:struggling with|having trouble with|problem with|struggle with|difficulty controlling|trouble controlling)\s+([a-z0-9\s\-]+?)(?:\.|\,|$|while|when|every)',
            cleaned_lower
        )
        if challenge_match:
            ch_item = challenge_match.group(1).strip()
            if len(ch_item) > 2:
                memories.append(
                    ExtractedMemoryItem(
                        type=MemoryType.CHALLENGE,
                        content=sanitize_sensitive_content(f"User reports struggling with {ch_item}."),
                        summary=f"Challenge: {ch_item}",
                        importance=3,
                        confidence=0.85
                    )
                )

        if "overthinking" in cleaned_lower:
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.CHALLENGE,
                    content="User reports constantly overthinking about the future.",
                    summary="Challenge: Overthinking",
                    importance=3,
                    confidence=0.85
                )
            )

        # 7. Extract CONTEXT (Ongoing life situation / job search / project)
        # Matches: "currently searching for a new job in product management", "searching for a full-time job"
        context_job_match = re.search(
            r'(?:searching for|looking for)\s+(?:a\s+)?([a-z0-9\s\-]+?(?:job|internship|role|opportunity))(?:\.|\,|$|in\s+[a-z]+)',
            cleaned_lower
        )
        if context_job_match:
            job_target = context_job_match.group(1).strip()
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.CONTEXT,
                    content=sanitize_sensitive_content(f"User is currently searching for a {job_target}."),
                    summary=f"Context: Searching for a {job_target}",
                    importance=3,
                    confidence=0.85
                )
            )
        elif "searching for a new job" in cleaned_lower:
            memories.append(
                ExtractedMemoryItem(
                    type=MemoryType.CONTEXT,
                    content="User is currently searching for a new job.",
                    summary="Context: Searching for a new job",
                    importance=3,
                    confidence=0.85
                )
            )

        return MemoryExtractionResult(
            should_remember=len(memories) > 0,
            memories=memories
        )
