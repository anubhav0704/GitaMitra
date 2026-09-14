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
        gita_concepts: Optional[List[Dict[str, Any]]] = None
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
            sections.append("<!-- Background context about the user's ongoing journey. Only weave into the response if DIRECTLY relevant to the current user question. If the user is asking about an unrelated topic, DO NOT force mention of past memories. -->")
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
        sections.append("\n<response_instructions>")
        sections.append(
            "Respond as GitaMitra following your core personality and the strategy above.\n"
            "- Speak strictly in the FIRST PERSON ('I', 'my', 'me'). NEVER say 'You are GitaMitra' or use second person to refer to yourself.\n"
            "- Behave like an intelligent, empathetic spiritual companion in a real-time living dialogue—NOT a rigid, hardcoded chatbot.\n"
            "- Do NOT use robotic, hardcoded section headings (such as '### Understanding', '### Gita's Perspective', '### Saar', '### What You Can Do', etc.). Speak naturally in flowing paragraphs with conversational warmth.\n"
            "- Weave the Gita's wisdom and concepts organically into the conversation. Do NOT dump Sanskrit verses or scriptural citations unless the user explicitly requests them or they directly illuminate the question.\n"
            "- Answer ONLY what is relevant to the seeker's inquiry. Avoid rambling, unrelated tangents, or unsolicited life lectures.\n"
            "- If the strategy is IDENTITY (or user asks if you are Shri Krishna): State clearly in the first sentence: 'I am GitaMitra, an AI spiritual companion inspired by the Bhagavad Gita, and not Shri Krishna Himself.' Keep it to 1-2 warm, direct conversational paragraphs without headings, action checklists, or verses.\n"
            "- If the strategy is CRISIS: Focus on immediate empathy and helpline resources without philosophical lectures.\n"
            "- For life challenges: Empathize with their specific situation first, illuminate it with practical Gita wisdom, offer 2-3 concrete practical steps, and close with an encouraging reflection or conversational question.\n"
            "- Match the user's language (English, Hindi, or Hinglish)."
        )
        sections.append("</response_instructions>")

        return "\n".join(sections)
