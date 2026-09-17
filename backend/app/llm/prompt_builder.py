import os
from typing import List, Dict, Any, Optional

GITAMITRA_PROMPT_VERSION = "1.0"

class PromptBuilder:
    """
    Constructs modular, structured, clearly-delimited prompts for GitaMitra.
    Loads modular system sections, strategy guidelines, context templates,
    and formats prompts dynamically according to response depth and strategy.
    """

    PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")

    @classmethod
    def _read_file(cls, relative_path: str, default: str = "") -> str:
        full_path = os.path.join(cls.PROMPTS_DIR, relative_path)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        return default

    @classmethod
    def load_system_prompt(cls, response_depth: str = "BALANCED") -> str:
        """Assembles the modular system prompt."""
        identity = cls._read_file("system/identity.txt", "You are GitaMitra, an AI spiritual companion inspired by the Bhagavad Gita.")
        personality = cls._read_file("system/personality.txt")
        religious_rules = cls._read_file("system/religious_rules.txt")
        safety = cls._read_file("system/safety.txt")
        response_style = cls._read_file("system/response_style.txt")

        depth_instructions = ""
        if response_depth.upper() == "SIMPLE":
            depth_instructions = (
                "\nRESPONSE DEPTH: SIMPLE (CONCISE)\n"
                "- Keep your explanation brief, clear, and direct (under 200 words if possible).\n"
                "- Provide a brief emotional acknowledgment, core Gita insight, 1-2 practical steps, and a 1-sentence Saar.\n"
                "- Avoid long expositions."
            )
        elif response_depth.upper() == "DEEP":
            depth_instructions = (
                "\nRESPONSE DEPTH: DEEP (PHILOSOPHICAL)\n"
                "- Offer an in-depth philosophical examination of the underlying Gita concepts (e.g. Atman vs mind/body, Gunas, Buddhi Yoga, Svadharma).\n"
                "- Analyze why the problem arises from the perspective of desire, attachment, or ignorance of one's true nature.\n"
                "- Provide comprehensive practical guidance and profound self-inquiry reflection."
            )
        else: # BALANCED
            depth_instructions = (
                "\nRESPONSE DEPTH: BALANCED (MODERATE)\n"
                "- Provide a balanced blend of compassionate emotional acknowledgment, clear Gita philosophy, verified scripture reference, concise Saar, and 3-4 concrete modern action steps."
            )

        parts = [
            f"<!-- GitaMitra System Prompt Version {GITAMITRA_PROMPT_VERSION} -->",
            identity,
            "\n" + personality,
            "\n" + religious_rules,
            "\n" + safety,
            "\n" + response_style,
            "\n" + depth_instructions
        ]
        return "\n".join(p for p in parts if p.strip())

    @classmethod
    def build_prompt(
        cls,
        user_message: str,
        rag_context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_memory_context: Optional[str] = None,
        strategy: str = "ACKNOWLEDGE_AND_ACTION",
        response_depth: str = "BALANCED",
        detected_emotions: Optional[List[str]] = None,
        gita_concepts: Optional[List[Dict[str, Any]]] = None,
        is_first_response: bool = False,
        user_language: Optional[str] = "en"
    ) -> str:
        """
        Combines retrieved Gita context, user memories, conversation history,
        strategy guidance, and current user question into a clean, secure prompt.
        """
        sections = []

        # 1. Strategy Guidance
        strategy_file_map = {
            "CRISIS": "strategies/crisis.txt",
            "GREETING": "strategies/greeting.txt",
            "IDENTITY": "strategies/identity.txt",
            "SCRIPTURE_FOCUSED": "strategies/scripture_focused.txt",
            "CLARIFY_AND_GUIDE": "strategies/clarify_guide.txt",
            "CHALLENGE_PERSPECTIVE": "strategies/challenge.txt",
            "PRACTICAL_ACTION": "strategies/practical_action.txt",
            "ACKNOWLEDGE_AND_ACTION": "strategies/acknowledge_action.txt"
        }
        strat_filename = strategy_file_map.get(strategy, "strategies/acknowledge_action.txt")
        strat_content = cls._read_file(strat_filename)

        sections.append("<response_strategy>")
        sections.append(f"CURRENT STRATEGY: {strategy}")
        if strat_content:
            sections.append(strat_content)
        if detected_emotions:
            sections.append(f"Detected Emotional Signals: {', '.join(detected_emotions)}")
        if gita_concepts:
            concept_names = [f"{c['name']} ({c.get('sanskrit', '')})" for c in gita_concepts]
            sections.append(f"Relevant Gita Principles: {', '.join(concept_names)}")
        sections.append("</response_strategy>")

        # 2. Retrieved Gita Context (Ground Truth)
        sections.append("\n<gita_context>")
        if rag_context and rag_context.strip():
            sections.append(rag_context.strip())
        else:
            sections.append("No specific verified Bhagavad Gita verse was retrieved for this exact query. Do NOT invent verse citations. Provide conceptual Gita wisdom without fabricated references.")
        sections.append("</gita_context>")

        # 3. User Long-Term Memory (Context only; strictly user-isolated)
        if user_memory_context and user_memory_context.strip():
            sections.append("\n<user_memory>")
            sections.append(
                "<!-- STRICT CONVERSATION ISOLATION & MEMORY INTEGRITY:\n"
                "Every new conversation is fresh, unique, and focused solely on what the seeker asks right now.\n"
                "- NEVER proactively drag in, mention, or assume past events, interviews, setbacks, or personal history UNLESS the seeker explicitly asks about them or refers to them in their current message.\n"
                "- If the seeker asks about a Gita verse, scripture, or philosophical concept, focus 100% on that topic without dragging in previous chat baggage.\n"
                "- Only connect to past memory if the seeker explicitly asked to connect to it or directly brought up that specific past topic. -->"
            )
            sections.append(user_memory_context.strip())
            sections.append("</user_memory>")

        # 4. Recent Conversation History (bounded)
        if conversation_history and len(conversation_history) > 0:
            sections.append("\n<recent_conversation>")
            for msg in conversation_history:
                role = msg.get("role", "user").capitalize()
                content = msg.get("content", "").strip()
                sections.append(f"{role}: {content}")
            sections.append("</recent_conversation>")

        # 5. Current User Question
        sections.append("\n<user_question>")
        sections.append(user_message.strip())
        sections.append("</user_question>")

        # 6. Response Directives
        instructions = [
            "Respond as GitaMitra following your core personality and the strategy above.",
            "- Speak strictly in the FIRST PERSON ('I', 'my', 'me'). NEVER say 'You are GitaMitra' or use second person to refer to yourself.",
            "- PURE AGENTIC & REAL-WORLD CONVERSATION: Speak like a real-time, living person walking alongside the seeker—channeling the calm depth, clarity, and grounded presence of Krishna naturally, without robotic affectation or theatrical roleplay.",
            "- BANISH HARDCODED & CLICHÉ OPENINGS: NEVER start with canned phrases like 'I hear how the...', 'I hear that...', 'I understand how...', 'It is natural to feel...', 'I hear the resonance of...'. Jump straight into the dialogue naturally and directly, exactly as a wise friend would in a real conversation.",
            "- DO ONLY WHAT THE SEEKER ASKS: Stay tightly focused on the seeker's inquiry. No unsolicited tangents, no assuming personal situations they didn't bring up.",
            "- SCRIPTURAL GROUNDING: Focus purely on the verse or topic asked. If the seeker asks about Chapter 2 Verse 32, delve deeply into that exact verse and explain how it applies practically to modern life, duty, ethical action, and inner courage. Do NOT dump random, extra, or unrequested shlokas.",
            "- MODERN REAL-WORLD APPLICATION: Provide grounded, practical wisdom for everyday life. How does the teaching help in modern work, family, inner dilemmas, and facing unavoidable challenges with equanimity?",
            "- CONVERSATIONAL TONE: Converse naturally in flowing, thoughtful paragraphs with genuine warmth and intellectual depth. Avoid rigid corporate headings ('### Understanding', '### Saar', '### What You Can Do').",
            "- If the strategy is IDENTITY (or user asks if you are Shri Krishna): State clearly in the first sentence: 'I am GitaMitra, an AI spiritual companion inspired by the Bhagavad Gita, and not Shri Krishna Himself.' Keep it to 1-2 warm, direct conversational paragraphs without headings, action checklists, or verses.",
            "- If the strategy is CRISIS: Focus on immediate empathy and helpline resources without philosophical lectures."
        ]

        if user_language == "hi":
            instructions.append(
                "- LANGUAGE MANDATE (HINDI): The seeker has chosen Hindi (हिन्दी) as their platform language. You MUST respond primarily in clear, graceful, and natural Hindi (written in Devanagari script). Keep the sacred heading as '## **!! Radhe Radhe !!**' if applicable. Present Gita wisdom, reflections, and guidance authentically in Hindi while keeping Sanskrit shlokas and terms accessible."
            )
        else:
            instructions.append("- Match the user's language (English, Hindi, or Hinglish). If the seeker writes in English, reply in English.")

        if is_first_response:
            instructions.append(
                "- SACRED GREETING (FIRST RESPONSE IN CHAT): This is the very first response in a new conversation with the seeker. You MUST begin your response with the sacred heading:\n## **!! Radhe Radhe !!**\nplaced as a prominent heading at the beginning of your response."
            )

        sections.append("\n<response_instructions>")
        sections.append("\n".join(instructions))
        sections.append("</response_instructions>")

        return "\n".join(sections)
