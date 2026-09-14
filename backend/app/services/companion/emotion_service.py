import re
from typing import Dict, List, Any, Optional

class EmotionContextService:
    """
    Lightweight emotional and contextual understanding layer for GitaMitra.
    Detects emotional signals, life context, crisis indicators, and provides
    concept mapping to core Gita teachings without making clinical diagnoses.
    Strict non-clinical rule: Never issues medical or psychiatric diagnoses.
    """

    CRISIS_CATEGORIES = {
        "suicide": [
            r"\b(?:kill|killing|end|ending)\s+(?:my\s*life|my\s*self)\b",
            r"\b(?:suicide|suicidal|want to die|commit suicide)\b",
            r"\b(?:don't want to live|no reason to live|tired of living)\b"
        ],
        "self_harm": [
            r"\b(?:harm|harming|hurt|hurting|cut|cutting)\s+my\s*self\b",
            r"\b(?:cut my\s*wrists?|overdose)\b"
        ],
        "abuse_violence": [
            r"\b(?:beats?|beaten|beating|physically abused?|assaulted?|domestic violence)\b",
            r"\b(?:tolerate|accept)\s+(?:this\s+)?abuse\b"
        ],
        "immediate_danger": [
            r"\b(?:threatened to|trying to|going to)\s+(?:kill|hurt|harm|attack)\s+me\b",
            r"\bin immediate danger\b"
        ]
    }

    EMOTIONS_MAP = {
        "fear": [
            "afraid", "scared", "fear", "fearful", "terrified", "frightened", "panic", "panicking", "dread"
        ],
        "anxiety": [
            "anxious", "anxiety", "nervous", "stressed", "restless", "worried", "worry", "overthinking", "uneasy"
        ],
        "sadness": [
            "sad", "unhappy", "depressed", "down", "sorrow", "crying", "miserable", "heartbroken", "gloomy"
        ],
        "grief": [
            "grief", "mourning", "loss", "bereavement", "passed away", "lost my", "died", "death of"
        ],
        "anger": [
            "angry", "mad", "rage", "furious", "irritated", "annoyed", "bitter", "resentment", "hate"
        ],
        "frustration": [
            "frustrated", "stuck", "fed up", "helpless", "powerless", "exasperated"
        ],
        "jealousy": [
            "jealous", "jealousy", "envy", "envious", "comparing", "comparison", "inferior", "why him", "why her"
        ],
        "envy": [
            "envy", "envious", "covet", "resenting others' success"
        ],
        "confusion": [
            "confused", "lost", "don't know", "what to do", "uncertain", "doubt", "dilemma", "clueless"
        ],
        "disappointment": [
            "disappointed", "let down", "unfulfilled", "failed", "failure", "heartbreak", "shattered"
        ],
        "failure": [
            "failed", "failure", "flunked", "lost out", "rejected", "setback", "loser"
        ],
        "attachment": [
            "attached", "attachment", "can't let go", "obsessed", "clinging", "dependent", "possessive"
        ],
        "insecurity": [
            "insecure", "worthless", "useless", "not good enough", "imposter", "inadequate", "self-doubt"
        ],
        "loneliness": [
            "lonely", "alone", "isolated", "abandoned", "nobody cares", "no one understands"
        ],
        "guilt": [
            "guilty", "regret", "remorse", "my mistake", "my fault", "blame myself", "ashamed", "shame"
        ],
        "hope": [
            "hope", "hopeful", "optimistic", "possibility", "looking forward", "better tomorrow"
        ],
        "motivation": [
            "motivated", "determined", "inspired", "ready to work", "driven", "ambitious", "strive"
        ],
        "calmness": [
            "calm", "peace", "peaceful", "serene", "tranquil", "steady", "equanimous", "grounded"
        ]
    }

    LIFE_CONTEXT_MAP = {
        "career": [
            "career", "job", "work", "boss", "colleague", "promotion", "office", "company", "business", "profession"
        ],
        "studies": [
            "study", "studies", "exam", "test", "school", "college", "university", "placement", "interview", "grade", "rank"
        ],
        "failure": [
            "failed", "failure", "rejected", "rejection", "unsuccessful", "lost", "didn't make it", "scored poorly"
        ],
        "success": [
            "succeeded", "success", "won", "topped", "hired", "got the job", "promotion", "achievement"
        ],
        "relationships": [
            "relationship", "partner", "boyfriend", "girlfriend", "husband", "wife", "dating", "breakup", "divorce", "love"
        ],
        "family": [
            "family", "parent", "parents", "mother", "father", "brother", "sister", "in-laws", "relatives", "child"
        ],
        "friendship": [
            "friend", "friends", "friendship", "best friend", "social circle", "peers"
        ],
        "health": [
            "health", "sick", "illness", "pain", "sleep", "insomnia", "tired", "exhausted", "burnout"
        ],
        "money": [
            "money", "financial", "debt", "salary", "loan", "expenses", "rich", "poor", "wealth"
        ],
        "discipline": [
            "discipline", "habit", "procrastinate", "procrastinating", "lazy", "focus", "distraction", "routine"
        ],
        "decision-making": [
            "decision", "choose", "choice", "options", "crossroads", "paths", "conflicted"
        ],
        "responsibility": [
            "responsibility", "responsible", "burden", "obligations", "obligated", "depend on me", "accountability", "duty"
        ],
        "identity": [
            "identity", "who am i", "self-worth", "existential", "belong", "lost myself", "true self"
        ],
        "purpose": [
            "purpose", "meaning", "why live", "direction in life", "destiny", "calling", "worth living"
        ],
        "spirituality": [
            "god", "krishna", "soul", "karma", "dharma", "gita", "moksha", "meditation", "spiritual", "peace of mind"
        ]
    }

    # Structured emotion/situation to Gita principles mapping
    GITA_MAPPING = {
        "fear": [
            "action", "equanimity", "detachment from results", "courage", "abhyasa"
        ],
        "anxiety": [
            "mind control", "living in the present", "nishkama karma", "peace of mind"
        ],
        "anger": [
            "desire", "attachment", "loss of judgment", "self-control", "buddhi"
        ],
        "jealousy": [
            "svadharma", "non-comparison", "freedom from envy", "contentment", "equanimity"
        ],
        "envy": [
            "svadharma", "non-comparison", "freedom from envy", "contentment"
        ],
        "failure": [
            "detachment from fruits", "learning", "effort over result", "equanimity in success and failure", "duty"
        ],
        "confusion": [
            "svadharma", "discernment", "inner wisdom", "responsible action", "buddhi yoga"
        ],
        "attachment": [
            "impermanence", "the eternal self", "vairagya", "balanced relationships"
        ],
        "insecurity": [
            "atman", "intrinsic worth", "focus on action", "freedom from validation"
        ],
        "discipline": [
            "abhyasa", "moderation", "mind mastery", "steady practice"
        ],
        "responsibility": [
            "kartavya", "svadharma", "karma yoga", "action without attachment"
        ],
        "identity": [
            "atman", "beyond the gunas", "eternal self", "svadharma"
        ],
        "grief": [
            "immortality of the soul", "impermanence of physical form", "compassionate acceptance"
        ]
    }

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        """
        Analyzes a message to extract emotions, life contexts, crisis flags,
        and mapped Gita guidance principles.
        """
        lower = text.lower()

        # 1. Check for crisis / emergency signals by category
        is_crisis = False
        crisis_type: Optional[str] = None

        for cat, patterns in cls.CRISIS_CATEGORIES.items():
            for pat in patterns:
                if re.search(pat, lower):
                    is_crisis = True
                    crisis_type = cat
                    break
            if is_crisis:
                break

        # 2. Detect emotions
        detected_emotions = []
        for emo, keywords in cls.EMOTIONS_MAP.items():
            if any(re.search(rf"\b{re.escape(kw)}\b", lower) for kw in keywords):
                detected_emotions.append(emo)

        # 3. Detect life contexts
        detected_contexts = []
        for ctx, keywords in cls.LIFE_CONTEXT_MAP.items():
            if any(re.search(rf"\b{re.escape(kw)}\b", lower) for kw in keywords):
                detected_contexts.append(ctx)

        # 4. Map to recommended Gita principles
        recommended_principles = []
        for emo in detected_emotions:
            for p in cls.GITA_MAPPING.get(emo, []):
                if p not in recommended_principles:
                    recommended_principles.append(p)

        for ctx in detected_contexts:
            for p in cls.GITA_MAPPING.get(ctx, []):
                if p not in recommended_principles:
                    recommended_principles.append(p)

        return {
            "is_crisis": is_crisis,
            "crisis_type": crisis_type,
            "emotions": detected_emotions,
            "contexts": detected_contexts,
            "gita_principles": recommended_principles,
            "primary_emotion": detected_emotions[0] if detected_emotions else None,
            "primary_context": detected_contexts[0] if detected_contexts else None
        }
