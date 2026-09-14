from typing import Dict, List, Set, Any, Optional

class GitaConceptGraph:
    """
    Structured concept layer on top of the Bhagavad Gita knowledge base.
    Maintains semantic nodes, definitions, related Gita concepts, and
    graph relationships to aid retrieval, reasoning, and explanation.
    """

    CONCEPTS: Dict[str, Dict[str, Any]] = {
        "dharma": {
            "name": "Dharma",
            "sanskrit": "धर्म",
            "definition": "Universal righteousness, cosmic order, moral duty, and the sacred law that sustains the world.",
            "keywords": ["dharma", "righteousness", "moral duty", "cosmic order", "ethics", "justice", "right action"],
            "related_nodes": ["svadharma", "kartavya", "karma_yoga"],
            "canonical_verses": ["4.7", "4.8", "18.66"]
        },
        "svadharma": {
            "name": "Svadharma",
            "sanskrit": "स्वधर्म",
            "definition": "One's own authentic duty, natural calling, and moral responsibility aligned with one's genuine nature.",
            "keywords": ["svadharma", "duty", "calling", "own path", "comparison", "jealousy", "career", "authentic"],
            "related_nodes": ["dharma", "karma_yoga", "freedom_from_envy", "kartavya"],
            "canonical_verses": ["3.35", "18.47"]
        },
        "karma": {
            "name": "Karma",
            "sanskrit": "कर्म",
            "definition": "The law of action and consequence; every intentional deed produces an impression and consequence.",
            "keywords": ["karma", "action", "deeds", "cause and effect", "consequence", "destiny"],
            "related_nodes": ["karma_yoga", "dharma", "nishkama_karma"],
            "canonical_verses": ["3.8", "4.17", "18.23"]
        },
        "karma_yoga": {
            "name": "Karma Yoga",
            "sanskrit": "कर्मयोग",
            "definition": "The path of dedicated action performed with sincerity, free from selfish anxiety over results.",
            "keywords": ["karma yoga", "action", "work", "duty", "effort", "nishkama karma", "fruits of action", "placement", "interview"],
            "related_nodes": ["nishkama_karma", "equanimity", "duty", "action"],
            "canonical_verses": ["2.47", "2.48", "3.19"]
        },
        "nishkama_karma": {
            "name": "Nishkama Karma",
            "sanskrit": "निष्काम कर्म",
            "definition": "Selfless action performed without attachment to personal fruits, praise, or outcome.",
            "keywords": ["nishkama karma", "selfless", "detachment from outcome", "results", "exam result", "fruits"],
            "related_nodes": ["karma_yoga", "detachment", "equanimity"],
            "canonical_verses": ["2.47", "4.20"]
        },
        "equanimity": {
            "name": "Equanimity (Samatvam)",
            "sanskrit": "समत्वम्",
            "definition": "Mental poise and balanced stability in both success and failure, joy and sorrow, gain and loss.",
            "keywords": ["equanimity", "balance", "samatvam", "success and failure", "calm", "steady mind", "unshakable"],
            "related_nodes": ["mind", "intellect", "detachment", "karma_yoga"],
            "canonical_verses": ["2.38", "2.48", "2.56"]
        },
        "detachment": {
            "name": "Detachment (Vairagya)",
            "sanskrit": "वैराग्य",
            "definition": "Healthy inner freedom from obsessive clinging, possessing, and outcome anxiety.",
            "keywords": ["detachment", "vairagya", "let go", "letting go", "unattached", "clinging", "breakup", "obsession"],
            "related_nodes": ["impermanence", "mind", "equanimity", "atman"],
            "canonical_verses": ["6.35", "18.52"]
        },
        "atman": {
            "name": "The Self (Atman)",
            "sanskrit": "आत्मन्",
            "definition": "The eternal, unchanging consciousness beyond the temporary body, mind, achievements, and setbacks.",
            "keywords": ["atman", "soul", "self", "eternal", "immortal", "worthless", "who am i", "identity", "true self"],
            "related_nodes": ["impermanence", "knowledge", "buddhi"],
            "canonical_verses": ["2.20", "2.22", "2.29"]
        },
        "mind": {
            "name": "Mind (Manas)",
            "sanskrit": "मनस्",
            "definition": "The sensory and emotional faculty, known for restlessness, which can be disciplined through practice.",
            "keywords": ["mind", "manas", "restless", "distracted", "overthinking", "focus", "procrastination"],
            "related_nodes": ["abhyasa", "intellect", "detachment", "meditation"],
            "canonical_verses": ["6.5", "6.6", "6.26", "6.34", "6.35"]
        },
        "intellect": {
            "name": "Intellect / Discernment (Buddhi)",
            "sanskrit": "बुद्धि",
            "definition": "The higher faculty of wisdom, decision-making, and discernment that guides the mind and senses.",
            "keywords": ["intellect", "buddhi", "discernment", "wisdom", "decision", "clarity", "confusion"],
            "related_nodes": ["mind", "dharma", "knowledge"],
            "canonical_verses": ["2.49", "2.65", "18.30"]
        },
        "desire": {
            "name": "Desire (Kama)",
            "sanskrit": "काम",
            "definition": "Self-centered craving and insatiable longing that clouds wisdom and leads to attachment.",
            "keywords": ["desire", "kama", "craving", "longing", "lust", "obsession", "temptation"],
            "related_nodes": ["attachment", "anger", "mind"],
            "canonical_verses": ["2.62", "3.37", "16.21"]
        },
        "anger": {
            "name": "Anger (Krodha)",
            "sanskrit": "क्रोध",
            "definition": "Destructive mental agitation arising when desire is thwarted, which leads to delusion and ruined judgment.",
            "keywords": ["anger", "krodha", "rage", "furious", "wrath", "bitterness", "resentment"],
            "related_nodes": ["desire", "mind", "intellect"],
            "canonical_verses": ["2.63", "16.21"]
        },
        "desire_and_anger": {
            "name": "Desire and Anger (Kama & Krodha)",
            "sanskrit": "काम-क्रोध",
            "definition": "The destructive cycle where unfulfilled craving leads to attachment, anger, delusion, and loss of wisdom.",
            "keywords": ["desire", "kama", "anger", "krodha", "rage", "craving", "obsession", "frustration"],
            "related_nodes": ["mind", "intellect", "equanimity"],
            "canonical_verses": ["2.62", "2.63", "3.37"]
        },
        "ego": {
            "name": "Ego (Ahankara)",
            "sanskrit": "अहङ्कार",
            "definition": "The illusory sense of separate individuality and false pride in doership.",
            "keywords": ["ego", "ahankara", "pride", "superior", "i did it", "arrogance", "doership"],
            "related_nodes": ["atman", "gunas", "intellect"],
            "canonical_verses": ["3.27", "18.53", "18.58"]
        },
        "knowledge": {
            "name": "Knowledge (Jnana)",
            "sanskrit": "ज्ञान",
            "definition": "Spiritual insight and direct experiential realization of truth that dissolves delusion.",
            "keywords": ["knowledge", "jnana", "wisdom", "insight", "enlightenment", "truth", "self-realization"],
            "related_nodes": ["intellect", "atman", "dharma"],
            "canonical_verses": ["4.38", "7.2", "18.20"]
        },
        "bhakti": {
            "name": "Devotion (Bhakti)",
            "sanskrit": "भक्ति",
            "definition": "Loving adoration, pure reverence, and heartfelt devotion directed towards the Divine.",
            "keywords": ["bhakti", "devotion", "love of god", "worship", "faith", "reverence"],
            "related_nodes": ["surrender", "atman", "peace"],
            "canonical_verses": ["9.26", "12.8", "12.13"]
        },
        "meditation": {
            "name": "Meditation (Dhyana)",
            "sanskrit": "ध्यान",
            "definition": "The steady, continuous inward absorption of consciousness upon the Supreme Self.",
            "keywords": ["meditation", "dhyana", "contemplation", "stillness", "inner silence", "absorption"],
            "related_nodes": ["mind", "abhyasa", "equanimity"],
            "canonical_verses": ["6.12", "6.25", "6.26"]
        },
        "abhyasa": {
            "name": "Discipline & Practice (Abhyasa)",
            "sanskrit": "अभ्यास",
            "definition": "Consistent, repeated, patient effort combined with non-attachment to steady the mind and master action.",
            "keywords": ["abhyasa", "practice", "habit", "discipline", "routine", "consistency", "study"],
            "related_nodes": ["mind", "detachment", "karma_yoga"],
            "canonical_verses": ["6.35", "12.9"]
        },
        "gunas": {
            "name": "The Three Gunas",
            "sanskrit": "त्रिगुणाः",
            "definition": "The three fundamental qualities of nature: Sattva (purity/clarity), Rajas (passion/agitation), and Tamas (inertia/darkness).",
            "keywords": ["gunas", "sattva", "rajas", "tamas", "qualities of nature", "lethargy", "inertia", "passion"],
            "related_nodes": ["mind", "ego", "knowledge"],
            "canonical_verses": ["14.5", "14.18", "18.23"]
        },
        "renunciation": {
            "name": "Renunciation (Tyaga)",
            "sanskrit": "त्याग",
            "definition": "Relinquishment of selfish attachment to the fruits of work while faithfully fulfilling prescribed duties.",
            "keywords": ["renunciation", "tyaga", "sannyasa", "relinquish", "letting go of fruits"],
            "related_nodes": ["nishkama_karma", "detachment", "karma_yoga"],
            "canonical_verses": ["18.2", "18.7", "18.11"]
        },
        "surrender": {
            "name": "Surrender (Sharanagati)",
            "sanskrit": "शरणागति",
            "definition": "Total reliance and surrender of ego, anxiety, and moral dilemmas to the Supreme Divine.",
            "keywords": ["surrender", "sharanagati", "prapatti", "refuge", "take shelter", "faith"],
            "related_nodes": ["bhakti", "dharma", "equanimity"],
            "canonical_verses": ["9.22", "18.66"]
        },
        "bhakti_surrender": {
            "name": "Devotion & Surrender (Bhakti & Sharanagati)",
            "sanskrit": "भक्ति-शरणागति",
            "definition": "Trustful surrender of anxieties, burdens, and ego to the Divine consciousness, attaining fearless peace.",
            "keywords": ["bhakti", "surrender", "faith", "trust", "sharanagati", "fear", "overwhelmed"],
            "related_nodes": ["peace", "atman", "dharma"],
            "canonical_verses": ["9.22", "18.66"]
        },
        "duty": {
            "name": "Duty (Kartavya)",
            "sanskrit": "कर्तव्य",
            "definition": "Obligatory moral action that must be performed as an offering, without desire for reward.",
            "keywords": ["duty", "kartavya", "obligation", "responsibility", "right action"],
            "related_nodes": ["svadharma", "dharma", "karma_yoga"],
            "canonical_verses": ["3.8", "18.9"]
        },
        "impermanence": {
            "name": "Impermanence (Anitya)",
            "sanskrit": "अनित्य",
            "definition": "The transient nature of physical experiences, pain, pleasure, grief, and circumstance.",
            "keywords": ["impermanence", "anitya", "temporary", "this too shall pass", "loss", "grief", "change"],
            "related_nodes": ["atman", "equanimity", "detachment"],
            "canonical_verses": ["2.14", "9.33"]
        }
    }

    # Core relational pathways and chains modeled explicitly
    RELATIONSHIPS = [
        # Chain 1: desire -> attachment -> anger -> loss_of_discrimination (BG 2.62-63)
        {"from": "desire", "to": "attachment", "relation": "leads_to", "scripture_ref": "BG 2.62"},
        {"from": "attachment", "to": "anger", "relation": "leads_to_when_thwarted", "scripture_ref": "BG 2.62"},
        {"from": "anger", "to": "loss_of_discrimination", "relation": "clouds_intellect", "scripture_ref": "BG 2.63"},

        # Chain 2: karma_yoga -> action -> duty -> detachment_from_results -> equanimity (BG 2.47-48)
        {"from": "karma_yoga", "to": "action", "relation": "grounds_itself_in", "scripture_ref": "BG 2.47"},
        {"from": "action", "to": "duty", "relation": "fulfilled_as", "scripture_ref": "BG 2.47"},
        {"from": "duty", "to": "detachment_from_results", "relation": "executed_with", "scripture_ref": "BG 2.47"},
        {"from": "detachment_from_results", "to": "equanimity", "relation": "culminates_in", "scripture_ref": "BG 2.48"},

        # Chain 3: svadharma -> authentic_duty -> freedom_from_comparison -> peace (BG 3.35, 18.47)
        {"from": "svadharma", "to": "authentic_duty", "relation": "defines", "scripture_ref": "BG 3.35"},
        {"from": "authentic_duty", "to": "freedom_from_comparison", "relation": "yields", "scripture_ref": "BG 3.35"},
        {"from": "freedom_from_comparison", "to": "peace", "relation": "bestows", "scripture_ref": "BG 18.47"},

        # Additional complementary conceptual edges
        {"from": "mind", "to": "abhyasa", "relation": "disciplined_by", "scripture_ref": "BG 6.35"},
        {"from": "mind", "to": "detachment", "relation": "stabilized_by", "scripture_ref": "BG 6.35"},
        {"from": "failure", "to": "effort_and_learning", "relation": "transformed_by", "scripture_ref": "BG 2.47"}
    ]

    @classmethod
    def compute_concept_affinities(cls, query: str, emotions: List[str], contexts: List[str]) -> Dict[str, float]:
        """
        Computes relevance affinities (0.0 to 1.0+) for all Gita concepts given query text,
        detected emotions, and life contexts. Used to boost hybrid RAG retrieval and rerank results.
        """
        query_lower = query.lower()
        affinities: Dict[str, float] = {}

        for cid, data in cls.CONCEPTS.items():
            score = 0.0
            for kw in data["keywords"]:
                if kw in query_lower:
                    score += 0.4

            # Emotion associations
            if "jealousy" in emotions or "envy" in emotions:
                if cid in ("svadharma", "equanimity", "ego"):
                    score += 0.6
            if "failure" in contexts or "failure" in emotions or "disappointment" in emotions:
                if cid in ("karma_yoga", "nishkama_karma", "equanimity", "atman", "renunciation"):
                    score += 0.6
            if "fear" in emotions or "anxiety" in emotions:
                if cid in ("karma_yoga", "equanimity", "surrender", "bhakti_surrender", "mind"):
                    score += 0.6
            if "confusion" in emotions or "career" in contexts or "decision-making" in contexts:
                if cid in ("svadharma", "intellect", "duty", "karma_yoga"):
                    score += 0.6
            if "anger" in emotions:
                if cid in ("anger", "desire", "desire_and_anger", "mind", "intellect"):
                    score += 0.6
            if "discipline" in contexts or "procrastination" in query_lower:
                if cid in ("abhyasa", "mind", "karma_yoga", "gunas"):
                    score += 0.6
            if "grief" in emotions or "attachment" in emotions or "relationships" in contexts:
                if cid in ("atman", "impermanence", "detachment"):
                    score += 0.6
            if "responsibility" in contexts:
                if cid in ("duty", "svadharma", "karma_yoga"):
                    score += 0.6
            if "identity" in contexts:
                if cid in ("atman", "svadharma", "ego"):
                    score += 0.6

            if score > 0.0:
                affinities[cid] = round(score, 2)

        return affinities

    @classmethod
    def identify_concepts(cls, query: str, emotions: List[str], contexts: List[str]) -> List[Dict[str, Any]]:
        """
        Identifies top relevant Gita concepts based on query keywords, emotions, and life contexts.
        """
        affinities = cls.compute_concept_affinities(query, emotions, contexts)
        matched: List[Dict[str, Any]] = []

        for cid, score in affinities.items():
            if cid not in cls.CONCEPTS:
                continue
            data = cls.CONCEPTS[cid]
            matched.append({
                "id": cid,
                "name": data["name"],
                "sanskrit": data["sanskrit"],
                "definition": data["definition"],
                "canonical_verses": data["canonical_verses"],
                "relevance_score": score
            })

        # Sort by relevance score descending
        matched.sort(key=lambda x: x["relevance_score"], reverse=True)
        return matched[:4]

    @classmethod
    def get_canonical_verse_keys(cls, concepts: List[Dict[str, Any]]) -> List[str]:
        """Collects canonical verse keys for retrieved concepts to assist RAG boosting."""
        keys = []
        for c in concepts:
            for vk in c.get("canonical_verses", []):
                if vk not in keys:
                    keys.append(vk)
        return keys
