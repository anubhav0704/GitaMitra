import json
import os

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'gita', 'raw')

CHAPTER_VERSE_COUNTS = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
    10: 42, 11: 55, 12: 20, 13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
}

def validate():
    chapters_path = os.path.join(RAW_DIR, 'chapters.json')
    verses_path = os.path.join(RAW_DIR, 'verses.json')

    if not os.path.exists(chapters_path) or not os.path.exists(verses_path):
        print("ERROR: Dataset files not found. Run download_dataset.py first.")
        return False

    with open(chapters_path, 'r', encoding='utf-8') as f:
        chapters = json.load(f)
    
    with open(verses_path, 'r', encoding='utf-8') as f:
        verses = json.load(f)

    # Validations
    print("## Gita Dataset Validation")
    
    # 1. Chapters
    if len(chapters) != 18:
        print(f"ERROR: Expected 18 chapters, found {len(chapters)}")
        return False
    print(f"Chapters found: {len(chapters)}")

    # 2. Verses
    if len(verses) != 700:
        print(f"ERROR: Expected 700 verses, found {len(verses)}")
        return False
    print(f"Verses found: {len(verses)}")

    duplicate_verses = 0
    missing_sanskrit = 0
    invalid_chapter_numbers = 0
    invalid_verse_numbers = 0

    seen_keys = set()
    verse_counts = {i: 0 for i in range(1, 19)}

    for v in verses:
        ch_num = v.get("chapter_number")
        v_num = v.get("verse_number")
        sanskrit = v.get("sanskrit")
        
        if ch_num is None or not (1 <= ch_num <= 18):
            invalid_chapter_numbers += 1
            continue

        if v_num is None or v_num < 1:
            invalid_verse_numbers += 1
        
        verse_counts[ch_num] += 1
        
        key = f"{ch_num}.{v_num}"
        if key in seen_keys:
            duplicate_verses += 1
        seen_keys.add(key)

        if not sanskrit or not str(sanskrit).strip():
            missing_sanskrit += 1

    for ch_num, expected_count in CHAPTER_VERSE_COUNTS.items():
        if verse_counts[ch_num] != expected_count:
            print(f"ERROR: Chapter {ch_num} expected {expected_count} verses, got {verse_counts[ch_num]}")
            return False

    print(f"Duplicate verses: {duplicate_verses}")
    print(f"Missing Sanskrit: {missing_sanskrit}")
    print(f"Invalid chapter numbers: {invalid_chapter_numbers}")
    print(f"Invalid verse numbers: {invalid_verse_numbers}")

    success = (duplicate_verses == 0 and missing_sanskrit == 0 
               and invalid_chapter_numbers == 0 and invalid_verse_numbers == 0)

    print(f"Result: {'PASS' if success else 'FAIL'}")
    return success

if __name__ == "__main__":
    import sys
    if not validate():
        sys.exit(1)
