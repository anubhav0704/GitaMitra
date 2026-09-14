import asyncio
import re
from typing import AsyncGenerator, Dict, Any, Optional

from app.llm.base import LLMProvider, LLMResponse

class MockProvider(LLMProvider):
    """
    Intelligent scripture-grounded local fallback provider.
    Ensures GitaMitra functions reliably out-of-the-box, adheres strictly to
    retrieved verses from RAG, and streams response chunks via SSE.
    """

    def __init__(self, model: str = "gitamitra-local-v1"):
        self.model = model

    def _extract_user_query(self, prompt: str) -> str:
        match_xml = re.search(r"<user_question>\s*(.*?)\s*</user_question>", prompt, re.DOTALL)
        if match_xml:
            return match_xml.group(1).strip()
        match = re.search(r"=== CURRENT USER QUESTION ===\s*\n(.*?)(?=\n===|$)", prompt, re.DOTALL)
        if match:
            return match.group(1).strip()
        return prompt.strip()

    def _extract_verses(self, prompt: str) -> list:
        verses = []
        block = ""
        match_xml = re.search(r"<gita_context>\s*(.*?)\s*</gita_context>", prompt, re.DOTALL)
        if match_xml:
            block = match_xml.group(1).strip()
        else:
            match_legacy = re.search(r"=== RETRIEVED GITA CONTEXT ===\s*\n(.*?)(?=\n===|$)", prompt, re.DOTALL)
            if match_legacy:
                block = match_legacy.group(1).strip()

        if not block or "No specific verified" in block or "No highly relevant" in block or "No relevant" in block:
            return verses

        # Look for Bhagavad Gita X.Y
        verse_blocks = re.split(r"-{20,}", block)
        for vb in verse_blocks:
            vb = vb.strip()
            if not vb:
                continue
            ref_match = re.search(r"Bhagavad Gita (\d+\.\d+)", vb)
            ref = f"Bhagavad Gita {ref_match.group(1)}" if ref_match else ""
            
            sanskrit_match = re.search(r"Sanskrit:\s*\n(.*?)(?=\nTranslation:|\nRelated themes:|$)", vb, re.DOTALL)
            sanskrit = sanskrit_match.group(1).strip() if sanskrit_match else ""

            trans_match = re.search(r"Translation:\s*\n(.*?)(?=\nExplanation:|\nRelated themes:|$)", vb, re.DOTALL)
            trans = trans_match.group(1).strip() if trans_match else ""

            if ref:
                verses.append({
                    "reference": ref,
                    "sanskrit": sanskrit,
                    "translation": trans
                })
        return verses

    def _detect_hindi(self, text: str) -> bool:
        hindi_keywords = ["karein", "kare", "mujhe", "mera", "meri", "tension", "hai", "kaise", "dar", "gussa", "kya", "karu", "raha", "rahi"]
        text_lower = text.lower()
        count = sum(1 for kw in hindi_keywords if re.search(r"\b" + kw + r"\b", text_lower))
        return count >= 2 or any('\u0900' <= char <= '\u097F' for char in text)

    def _synthesize_response(self, prompt: str) -> str:
        user_query = self._extract_user_query(prompt)
        verses = self._extract_verses(prompt)
        is_hindi = self._detect_hindi(user_query)

        # Handle Crisis
        if "CURRENT STRATEGY: CRISIS" in prompt or any(w in user_query.lower() for w in ["harm myself", "kill myself", "suicide", "want to die", "end my life"]):
            return (
                "I hear how overwhelming and painful things feel right now, but please know you are not alone. "
                "Your life is precious and has sacred dignity. Please connect with human support immediately:\n"
                "- Tele-MANAS (India): 14416 or 1800-891-4416 (24x7 Toll-free)\n"
                "- Emergency: 112"
            )

        # Handle Identity inquiries
        if any(w in user_query.lower() for w in ["are you shri krishna", "are you krishna", "are you god"]):
            return (
                "I am GitaMitra, an AI spiritual companion inspired by the Bhagavad Gita. "
                "I am not Shri Krishna Himself, nor do I possess supernatural knowledge. "
                "My purpose is to help you reflect upon the timeless teachings of the Gita and apply them to your daily life."
            )

        # Handle adversarial punishment inquiries
        if "deserve punishment" in user_query.lower():
            return (
                "The Bhagavad Gita does not state that people who experience setbacks are condemned or punished. "
                "Rather, Shri Krishna teaches in Chapter 2, Verse 47 that sincere effort is your true duty, "
                "and setbacks are opportunities for reflection and spiritual growth."
            )

        # Case 1: No retrieved verses
        if not verses:
            if is_hindi:
                return (
                    "### Understanding\n"
                    "Main aapki sthiti aur chinta ko samajh sakta hoon. Kabhi-kabhi jeevan mein aisi chunautiyan aati hain jahan mann ashaant ho jata hai.\n\n"
                    "### Guidance\n"
                    "Abhi is vishay par sidhe roop se koi vishisht shloka context mein uplabdh nahi hai, isliye main koi anargal shloka quote nahi karunga. Parantu Geeta ka mool siddhant hamesha yahi sikhata hai ki shant man se apne vartamaan kartavya par dhyan kendrit karein aur dhairya rakhein.\n\n"
                    "### What You Can Do\n"
                    "1. Gehri saans lein aur mann ko sthir karein.\n"
                    "2. Jo cheezein aapke niyantran mein hain, kewal unpar dhyaan lagayein.\n\n"
                    "### Reflection\n"
                    "Aap is samay apne mann ko shaant rakhne ke liye kaun sa chhota kadam utha sakte hain?"
                )
            else:
                return (
                    "### Understanding\n"
                    "I hear your concern and understand how challenging this situation can feel. It is completely natural to seek clarity when faced with uncertainty.\n\n"
                    "### Guidance\n"
                    "I could not find a sufficiently relevant verse in the current Gita knowledge base for this exact query, and following GitaMitra's principles, I will not fabricate an unrelated scriptural quote. However, the timeless philosophy of the Gita reminds us to cultivate inner stillness and focus on mindful action rather than succumbing to anxiety.\n\n"
                    "### What You Can Do\n"
                    "1. Pause and observe your thoughts without self-judgment.\n"
                    "2. Differentiate between what is within your control and what is not.\n"
                    "3. Direct your energy toward constructive, present-moment actions.\n\n"
                    "### Reflection\n"
                    "What is one positive, controllable action you can take right now to ease your mind?"
                )

        # Case 2: Grounded with retrieved verse(s)
        top_v = verses[0]
        ref = top_v["reference"]
        sanskrit = top_v["sanskrit"]
        translation = top_v["translation"]

        if is_hindi:
            return (
                f"### Understanding\n"
                f"Main samajh sakta hoon ki aap is sthiti ko lekar kashmakash aur chinta mehsoos kar rahe hain. "
                f"Bhagavad Gita mein Arjun ne bhi theek aisi hi duvidha aur mann ki ashirata ka anubhav kiya tha.\n\n"
                f"### Gita's Perspective\n"
                f"Bhagavad Gita hamein sikhata hai ki hamara adhikaar aur shakti kewal hamare vartamaan karm aur prayas par hai, "
                f"na ki aane wale parinam par. Parinam ki lagataar chinta hamare prayas ko kamzor bana deti hai.\n\n"
                f"### Relevant Shloka\n"
                f"**{ref}**\n\n"
                f"Sanskrit:\n{sanskrit}\n\n"
                f"Translation:\n{translation}\n\n"
                f"### Saar\n"
                f"Kewal apne kartavya-karm ko poori nishtha se karein. Parinam ka fal kya hoga, iski chinta chhod kar vartamaan prayas par samarpit ho jayein.\n\n"
                f"### What You Can Do\n"
                f"1. **Parinam se dhyan hatayein**: Fal ki chinta karne ke bajaye, agle kadam ki tayari par dhyan dein.\n"
                f"2. **Nishtha se prayas karein**: Apna 100% yogdan dein aur baki samay aur Ishwar par chhod dein.\n"
                f"3. **Mansik shanti banaye rakhein**: Dhyan aur atma-chintan ke dwara mann ki bechaini ko shant karein.\n\n"
                f"### Reflection\n"
                f"Kya aap parinam ke darr ko chhod kar agle ek ghante poori shanti se apne kaam par dhyan kendrit kar sakte hain?"
            )
        else:
            return (
                f"### Understanding\n"
                f"I completely understand the anxiety and pressure you are experiencing. "
                f"It is deeply human to worry about the future, yet that very worry often drains the energy needed to act effectively today.\n\n"
                f"### Gita's Perspective\n"
                f"The Bhagavad Gita addresses this exact human dilemma. Lord Krishna teaches that when we bind our sense of peace "
                f"to the outcomes of our efforts, we become paralyzed by fear. Instead, true equanimity and peak performance arise "
                f"when we dedicate ourselves wholeheartedly to the action itself without obsessive attachment to results.\n\n"
                f"### Relevant Shloka\n"
                f"**{ref}**\n\n"
                f"Sanskrit:\n{sanskrit}\n\n"
                f"Translation:\n{translation}\n\n"
                f"### Saar\n"
                f"Your sovereign right is to your sincere effort in the present moment, not to the fruit of that effort. "
                f"Release anxiety over future outcomes and invest your complete energy into righteous, focused action.\n\n"
                f"### What You Can Do\n"
                f"1. **Shift Focus to Preparation**: Replace worrying about the results with dedicated, methodical preparation for the task at hand.\n"
                f"2. **Detach from Imagined Catastrophes**: Recognize that anxiety is projecting worst-case scenarios; anchor yourself firmly in today's duty.\n"
                f"3. **Practice Equanimity**: Treat both success and setback as stepping stones for inner growth rather than personal identity markers.\n\n"
                f"### Reflection\n"
                f"What is the single most constructive action you can take right now, free from the worry of how it will turn out?"
            )

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs: Any
    ) -> LLMResponse:
        content = self._synthesize_response(prompt)
        return LLMResponse(content=content, model=self.model, usage={"prompt_tokens": len(prompt.split()), "completion_tokens": len(content.split())})

    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        full_text = self._synthesize_response(prompt)
        # Stream in words or chunks with slight async yielding
        words = re.findall(r"\S+|\s+", full_text)
        for w in words:
            yield w
            await asyncio.sleep(0.008)
