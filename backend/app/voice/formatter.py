import re
import logging

logger = logging.getLogger(__name__)

class SpeechTextFormatter:
    """
    Sanitizes and formats AI assistant responses for natural, respectful,
    calm Text-to-Speech delivery.
    
    Responsibilities:
    - Strips Markdown syntax (headers, asterisks, bullet points, links, code blocks)
    - Removes UI labels and raw citation tags (e.g. '### Gita's Perspective', '(BG 2.47)')
    - Preserves Sanskrit shlokas and Devanagari text
    - Preserves Hindi and Hinglish phrasing
    - Avoids reading technical database markers, IDs, JSON, or symbols
    """

    @classmethod
    def format_for_speech(cls, text: str) -> str:
        if not text:
            return ""

        cleaned = text

        # 1. Remove code blocks and inline code
        cleaned = re.sub(r'```[\s\S]*?```', '', cleaned)
        cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)

        # 2. Remove raw JSON structures or metadata blocks
        cleaned = re.sub(r'\{[^{}]*\}', '', cleaned)
        cleaned = re.sub(r'\[(?:VERSE|REF|METADATA|CITATION):?[^\]]*\]', '', cleaned, flags=re.IGNORECASE)

        # 3. Remove horizontal dividers
        cleaned = re.sub(r'^\s*[-*_]{3,}\s*$', '', cleaned, flags=re.MULTILINE)

        # 4. Remove UI/Markdown headings like '### Gita's Perspective' or '## Key Insight'
        # If header is purely a label, remove it; if it has text, keep the text without the hashtags
        cleaned = re.sub(r'^\s*#{1,6}\s*(?:Gita\'s Perspective|Spiritual Reflection|Reflection|Core Insight|Bhagavad Gita Wisdom|Summary|Verse Saar)\s*:?\s*$', '', cleaned, flags=re.MULTILINE | re.IGNORECASE)
        cleaned = re.sub(r'^\s*#{1,6}\s+', '', cleaned, flags=re.MULTILINE)

        # 5. Remove parenthetical verse citations like (Bhagavad Gita 2.47) or (BG 2.47) or (Chapter 2, Verse 47)
        cleaned = re.sub(r'\((?:Bhagavad\s+Gita|Gita|BG)?\s*(?:Chapter\s*\d+,?\s*)?(?:Verse\s*\d+|\d+\.\d+)\)', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\[(?:Bhagavad\s+Gita|Gita|BG)?\s*(?:Chapter\s*\d+,?\s*)?(?:Verse\s*\d+|\d+\.\d+)\]', '', cleaned, flags=re.IGNORECASE)

        # 6. Format Markdown links: [Link text](http://...) -> Link text
        cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', cleaned)

        # 7. Remove bold and italic markers: **bold** -> bold, *italic* -> italic, _italic_ -> italic
        cleaned = re.sub(r'\*\*([^*]+)\*\*', r'\1', cleaned)
        cleaned = re.sub(r'\*([^*]+)\*', r'\1', cleaned)
        cleaned = re.sub(r'__([^_]+)__', r'\1', cleaned)
        cleaned = re.sub(r'_([^_]+)_', r'\1', cleaned)

        # 8. Clean up bullet points and numbered list markers
        # Replace '- item' or '1. item' with clean sentence flow
        cleaned = re.sub(r'^\s*[-*+]\s+', '', cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r'^\s*\d+\.\s+', '', cleaned, flags=re.MULTILINE)

        # 9. Clean up decorative spiritual markers (like ✦, ॐ, etc.) for speech flow if needed,
        # but keep ॐ as a natural chant pause if alone
        cleaned = cleaned.replace('✦', '').replace('✨', '').replace('🙏', '')

        # 10. Collapse multiple consecutive linebreaks or spaces into clean pauses
        lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
        spoken_text = ". ".join(lines)

        # 11. Normalize duplicate punctuation (e.g. ".. " or ". . " or "?.")
        spoken_text = re.sub(r'\.+', '.', spoken_text)
        spoken_text = re.sub(r'\s+([,\.?!;:])', r'\1', spoken_text)
        spoken_text = re.sub(r'\s{2,}', ' ', spoken_text)

        return spoken_text.strip()
