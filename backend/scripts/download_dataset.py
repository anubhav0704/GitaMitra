import json
import os
import re
import urllib.request

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'gita', 'raw')
os.makedirs(RAW_DIR, exist_ok=True)

CHAPTER_VERSE_COUNTS = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
    10: 42, 11: 55, 12: 20, 13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
}

CHAPTER_THEMES = {
    1: ["Grief", "Despair", "Moral Dilemma", "Attachment", "Compassion"],
    2: ["Self-Realization", "Sankhya", "Immortality of the Soul", "Karma Yoga", "Equanimity", "Sthitaprajna"],
    3: ["Duty", "Selfless Action", "Karma Yoga", "Sacrifice", "Controlling Senses"],
    4: ["Transcendental Knowledge", "Avatara", "Renunciation in Action", "Wisdom", "Sacrifice"],
    5: ["Renunciation", "Inner Peace", "Action vs Inaction", "Detachment", "Brahman"],
    6: ["Meditation", "Mind Control", "Yoga Practice", "Equanimity", "Perseverance"],
    7: ["Knowledge of the Absolute", "Divine Manifestation", "Maya", "Four Types of Devotees"],
    8: ["Attaining the Supreme", "Life and Death", "Paths of Light and Darkness", "Remembrance"],
    9: ["Sovereign Science", "Royal Secret", "Unconditional Devotion", "Divine Presence"],
    10: ["Divine Glories", "Vibhuti", "Splendor of the Divine", "Infinite Magnificence"],
    11: ["Cosmic Vision", "Visvarupa", "Awe and Wonder", "Universal Form", "Surrender"],
    12: ["Bhakti Yoga", "Devotion", "Qualities of a Devotee", "Love for God", "Equanimity"],
    13: ["The Field and the Knower", "Kshetra and Kshetrajna", "Matter and Spirit", "True Wisdom"],
    14: ["Three Gunas", "Sattva Rajas Tamas", "Transcending the Qualities", "Liberation"],
    15: ["The Supreme Being", "Purushottama", "Tree of Existence", "Cosmic Order"],
    16: ["Divine and Demonic Natures", "Virtues and Vices", "Three Gates to Hell", "Moral Conduct"],
    17: ["Threefold Faith", "Shraddha", "Types of Food and Sacrifice", "Om Tat Sat"],
    18: ["Liberation and Renunciation", "Moksha", "Surrender", "Swadharma", "Supreme Devotion"]
}

# Key curated verses for precise philosophical retrieval
CURATED_METADATA = {
    "2.47": {
        "topics": ["action", "duty", "karma", "detachment", "results", "work", "failure"],
        "concepts": ["karma_yoga", "nishkama_karma"],
        "emotions": ["anxiety", "fear"],
        "life_situations": ["exam", "failure", "career", "work", "decision_making"],
        "keywords": ["duty", "right", "work", "action", "fruits", "results", "attachment", "motive"]
    },
    "2.62": {
        "topics": ["anger", "desire", "attachment", "senses", "peace"],
        "concepts": ["ladder_of_fall", "sense_control"],
        "emotions": ["anger", "craving", "frustration"],
        "life_situations": ["conflict", "loss_of_peace", "obsession"],
        "keywords": ["contemplating", "attachment", "desire", "anger", "passion"]
    },
    "2.63": {
        "topics": ["anger", "delusion", "memory", "intellect", "ruin"],
        "concepts": ["ruin_of_intellect", "delusion"],
        "emotions": ["anger", "rage"],
        "life_situations": ["loss_of_control", "conflict"],
        "keywords": ["anger", "delusion", "loss of memory", "intellect", "ruin"]
    },
    "16.21": {
        "topics": ["anger", "desire", "greed", "lust", "hell", "self-destruction"],
        "concepts": ["three_gates_of_hell", "asuric_nature"],
        "emotions": ["anger", "rage", "lust", "greed"],
        "life_situations": ["moral_crisis", "destructive_habits"],
        "keywords": ["threefold", "gate of hell", "lust", "anger", "greed", "destruction of soul"]
    },
    "2.20": {
        "topics": ["death", "soul", "immortality", "eternal", "grief"],
        "concepts": ["atman", "eternal_soul"],
        "emotions": ["grief", "sadness", "sorrow"],
        "life_situations": ["bereavement", "loss_of_loved_one", "mourning"],
        "keywords": ["unborn", "eternal", "changeless", "body is slain", "soul does not die"]
    },
    "2.22": {
        "topics": ["death", "reincarnation", "soul", "changing clothes", "grief"],
        "concepts": ["reincarnation", "transmigration"],
        "emotions": ["grief", "sadness"],
        "life_situations": ["death", "loss_of_loved_one", "bereavement"],
        "keywords": ["garments", "cast away", "new garments", "body", "dweller"]
    },
    "2.27": {
        "topics": ["death", "birth", "inevitable", "grief", "acceptance"],
        "concepts": ["destiny", "wheel_of_life"],
        "emotions": ["grief", "sorrow"],
        "life_situations": ["loss", "bereavement"],
        "keywords": ["death is certain", "birth is certain", "inevitable", "do not grieve"]
    },
    "3.35": {
        "topics": ["duty", "swadharma", "career", "calling", "authenticity"],
        "concepts": ["swadharma", "prescribed_duty"],
        "emotions": ["confusion", "doubt"],
        "life_situations": ["career", "decision_making", "vocation", "comparison"],
        "keywords": ["own duty", "swadharma", "duty of another", "better one's own duty", "perilous"]
    },
    "18.47": {
        "topics": ["duty", "swadharma", "career", "nature", "action"],
        "concepts": ["swadharma", "innate_nature"],
        "emotions": ["confusion", "doubt"],
        "life_situations": ["career", "decision_making", "vocation"],
        "keywords": ["better one's own duty", "swadharma", "flawed", "another's duty", "born duty"]
    },
    "18.48": {
        "topics": ["action", "duty", "imperfection", "failure", "perseverance"],
        "concepts": ["karma_yoga", "acceptance"],
        "emotions": ["discouragement", "giving up"],
        "life_situations": ["failure", "struggle", "giving up"],
        "keywords": ["duty born of nature", "fire wrapped in smoke", "defects", "do not abandon"]
    },
    "12.13": {
        "topics": ["equanimity", "envy", "jealousy", "compassion", "friendship"],
        "concepts": ["bhakti_yoga", "equal_vision"],
        "emotions": ["jealousy", "envy", "compassion", "peace"],
        "life_situations": ["relationships", "friendship", "comparison"],
        "keywords": ["no ill will", "friendly", "compassionate", "free from ego", "forgiving"]
    },
    "12.14": {
        "topics": ["contentment", "devotion", "equanimity", "peace", "steady mind"],
        "concepts": ["bhakti_yoga", "sthitaprajna"],
        "emotions": ["peace", "contentment"],
        "life_situations": ["daily_life", "mental_peace"],
        "keywords": ["content", "self-controlled", "firm resolve", "mind fixed on me", "dear to me"]
    },
    "7.7": {
        "topics": ["God", "divine", "nature", "supreme", "string of pearls"],
        "concepts": ["brahman", "ishvara", "all_pervading"],
        "emotions": ["devotion", "reverence", "awe"],
        "life_situations": ["spiritual_seeking", "existential_questions"],
        "keywords": ["nothing higher", "stringed pearls", "all rests in me", "supreme"]
    },
    "9.4": {
        "topics": ["God", "divine", "nature", "omnipresence", "unmanifest"],
        "concepts": ["unmanifest_form", "cosmic_pervasion"],
        "emotions": ["reverence", "wonder"],
        "life_situations": ["spiritual_seeking"],
        "keywords": ["all this world is pervaded", "unmanifest form", "all beings dwell in me"]
    },
    "10.8": {
        "topics": ["God", "origin", "creation", "divine", "source"],
        "concepts": ["source_of_all", "ishvara"],
        "emotions": ["devotion", "awe"],
        "life_situations": ["spiritual_seeking"],
        "keywords": ["source of all", "everything evolves from me", "worship me with devotion"]
    },
    "2.70": {
        "topics": ["peace", "mind", "desires", "ocean", "serenity"],
        "concepts": ["ocean_of_peace", "sthitaprajna"],
        "emotions": ["peace", "calm"],
        "life_situations": ["mental_peace", "restlessness", "stress"],
        "keywords": ["ocean", "waters enter", "remains unmoved", "desires enter", "attains peace"]
    },
    "5.29": {
        "topics": ["peace", "friend of all", "supreme Lord", "sacrifice"],
        "concepts": ["friend_of_all_beings", "shanti"],
        "emotions": ["peace", "security", "love"],
        "life_situations": ["anxiety", "seeking_peace"],
        "keywords": ["benefactor of all", "friend of all beings", "Lord of all worlds", "attains peace"]
    },
    "6.7": {
        "topics": ["peace", "equanimity", "heat and cold", "pleasure and pain", "honor and dishonor"],
        "concepts": ["dhyana_yoga", "conquered_self"],
        "emotions": ["peace", "equanimity"],
        "life_situations": ["stress", "turbulent_circumstances"],
        "keywords": ["conquered self", "peaceful", "heat and cold", "pleasure and pain", "honor and dishonor"]
    }
}

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def clean_html(raw_html):
    if not raw_html:
        return ""
    clean = re.sub(r'<.*?>', '', raw_html)
    return clean.strip()

def download_and_process():
    print("Fetching raw data from gita repository...")
    base_url = "https://raw.githubusercontent.com/gita/gita/master/data"
    
    raw_chapters = fetch_json(f"{base_url}/chapters.json")
    raw_verses = fetch_json(f"{base_url}/verse.json")
    raw_translations = fetch_json(f"{base_url}/translation.json")
    raw_commentaries = fetch_json(f"{base_url}/commentary.json")
    
    print(f"Loaded: {len(raw_chapters)} chapters, {len(raw_verses)} verses, {len(raw_translations)} translations, {len(raw_commentaries)} commentaries.")

    # Organize translations by verse_id: {verse_id: {'en': ..., 'hi': ...}}
    trans_map = {}
    for t in raw_translations:
        vid = t['verse_id']
        lang = t.get('lang', '').lower()
        author = t.get('authorName', '')
        desc = clean_html(t.get('description', ''))
        if not desc:
            continue
            
        if vid not in trans_map:
            trans_map[vid] = {'en': {}, 'hi': {}}
            
        if lang == 'english':
            trans_map[vid]['en'][author] = desc
        elif lang == 'hindi':
            trans_map[vid]['hi'][author] = desc

    # Organize commentaries by verse_id
    comm_map = {}
    for c in raw_commentaries:
        vid = c['verse_id']
        lang = c.get('lang', '').lower()
        author = c.get('authorName', '')
        desc = clean_html(c.get('description', ''))
        if not desc:
            continue
            
        if vid not in comm_map:
            comm_map[vid] = {'en': {}, 'hi': {}}
            
        if lang == 'english':
            comm_map[vid]['en'][author] = desc
        elif lang == 'hindi':
            comm_map[vid]['hi'][author] = desc

    # Process chapters
    processed_chapters = []
    for ch in sorted(raw_chapters, key=lambda x: x['chapter_number']):
        ch_num = ch['chapter_number']
        processed_chapters.append({
            "chapter_number": ch_num,
            "title_sanskrit": ch.get('name', f"अध्याय {ch_num}"),
            "title_transliteration": ch.get('name_transliterated', f"Chapter {ch_num}"),
            "title_english": ch.get('name_translation', f"Chapter {ch_num}"),
            "title_hindi": ch.get('name_meaning', ch.get('name', f"अध्याय {ch_num}")),
            "summary_en": ch.get('chapter_summary', f"Summary for Chapter {ch_num}"),
            "summary_hi": ch.get('chapter_summary_hindi', f"अध्याय {ch_num} का सारांश"),
            "total_verses": CHAPTER_VERSE_COUNTS[ch_num],
            "themes": CHAPTER_THEMES.get(ch_num, ["Dharma", "Yoga"])
        })

    # Process verses (ensuring exactly 700 canonical verses)
    # Chapter 13 in raw has 35 verses (1 is intro question). We merge 13.1 intro into 13.2 and renumber 13.2..35 to 13.1..34.
    processed_verses = []
    
    ch13_intro_translit = ""
    ch13_intro_sanskrit = ""
    
    for v in raw_verses:
        ch_num = v['chapter_number']
        v_num = v['verse_number']
        vid = v['id']
        
        # Handle Chapter 13 intro verse
        if ch_num == 13 and v_num == 1:
            ch13_intro_sanskrit = v.get('text', '')
            ch13_intro_translit = v.get('transliteration', '')
            continue
        elif ch_num == 13 and v_num > 1:
            # Shift verse number by -1 so Ch 13 has 1..34
            actual_v_num = v_num - 1
        else:
            actual_v_num = v_num
            
        # Select English translation: prefer Swami Sivananda, then Gambirananda, Adidevananda, then any
        en_candidates = trans_map.get(vid, {}).get('en', {})
        translation_en = (
            en_candidates.get('Swami Sivananda') or
            en_candidates.get('Swami Gambirananda') or
            en_candidates.get('Swami Adidevananda') or
            (next(iter(en_candidates.values())) if en_candidates else "")
        )
        
        # Select Hindi translation: prefer Swami Ramsukhdas, then Tejomayananda, then any
        hi_candidates = trans_map.get(vid, {}).get('hi', {})
        translation_hi = (
            hi_candidates.get('Swami Ramsukhdas') or
            hi_candidates.get('Swami Tejomayananda') or
            (next(iter(hi_candidates.values())) if hi_candidates else "")
        )
        
        # Select English commentary/explanation
        en_comm_candidates = comm_map.get(vid, {}).get('en', {})
        explanation_en = (
            en_comm_candidates.get('Swami Sivananda') or
            en_comm_candidates.get('Swami Chinmayananda') or
            (next(iter(en_comm_candidates.values())) if en_comm_candidates else "")
        )
        
        # Select Hindi commentary/explanation
        hi_comm_candidates = comm_map.get(vid, {}).get('hi', {})
        explanation_hi = (
            hi_comm_candidates.get('Swami Ramsukhdas') or
            (next(iter(hi_comm_candidates.values())) if hi_comm_candidates else "")
        )
        
        verse_key = f"{ch_num}.{actual_v_num}"
        
        # Semantic metadata
        curated = CURATED_METADATA.get(verse_key, {})
        
        topics = curated.get("topics")
        if not topics:
            topics = list(CHAPTER_THEMES.get(ch_num, ["Dharma", "Yoga"]))[:3]
            
        concepts = curated.get("concepts")
        if not concepts:
            concepts = ["karma_yoga" if ch_num in [2, 3, 5] else ("bhakti_yoga" if ch_num in [7, 9, 12] else "jnana_yoga")]
            
        emotions = curated.get("emotions")
        if not emotions:
            emotions = ["confusion" if ch_num == 1 else "peace"]
            
        life_situations = curated.get("life_situations")
        if not life_situations:
            life_situations = ["decision_making" if ch_num in [1, 2, 3] else "spiritual_growth"]
            
        keywords = curated.get("keywords")
        if not keywords:
            # Extract basic keywords from translation_en
            words = re.findall(r'\w+', translation_en.lower())
            stop = {"the", "and", "that", "this", "with", "from", "for", "who", "which", "shall", "unto", "thou", "thee", "hath"}
            kws = [w for w in set(words) if len(w) > 4 and w not in stop]
            keywords = kws[:6]

        sanskrit_text = v.get('text', '')
        translit_text = v.get('transliteration', '')
        
        # If this is 13.1 (which was renumbered from 13.2), prepend the intro question if appropriate
        if ch_num == 13 and actual_v_num == 1 and ch13_intro_sanskrit:
            sanskrit_text = f"{ch13_intro_sanskrit}\n\n{sanskrit_text}"
            translit_text = f"{ch13_intro_translit}\n\n{translit_text}"

        processed_verses.append({
            "chapter_number": ch_num,
            "verse_number": actual_v_num,
            "verse_key": verse_key,
            "sanskrit": sanskrit_text.strip(),
            "transliteration": translit_text.strip(),
            "translation_en": translation_en.strip(),
            "translation_hi": translation_hi.strip(),
            "explanation_en": explanation_en.strip() if explanation_en else None,
            "explanation_hi": explanation_hi.strip() if explanation_hi else None,
            "topics": topics,
            "concepts": concepts,
            "emotions": emotions,
            "life_situations": life_situations,
            "keywords": keywords,
            "source_name": "Bhagavad Gita - Swami Sivananda / Swami Ramsukhdas",
            "source_license": "Public Domain"
        })

    # Save to RAW_DIR
    chapters_path = os.path.join(RAW_DIR, 'chapters.json')
    verses_path = os.path.join(RAW_DIR, 'verses.json')
    
    with open(chapters_path, 'w', encoding='utf-8') as f:
        json.dump(processed_chapters, f, ensure_ascii=False, indent=2)
        
    with open(verses_path, 'w', encoding='utf-8') as f:
        json.dump(processed_verses, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved {len(processed_chapters)} chapters and {len(processed_verses)} verses into {RAW_DIR}")

if __name__ == '__main__':
    download_and_process()
