import asyncio
import json
import os
import sys
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_maker
from app.models.gita import Chapter, Verse

RAW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'gita', 'raw'))

async def seed_data():
    chapters_path = os.path.join(RAW_DIR, 'chapters.json')
    verses_path = os.path.join(RAW_DIR, 'verses.json')

    if not os.path.exists(chapters_path) or not os.path.exists(verses_path):
        print("ERROR: Dataset files not found. Run validate_gita.py first.")
        return

    with open(chapters_path, 'r', encoding='utf-8') as f:
        chapters_data = json.load(f)
    
    with open(verses_path, 'r', encoding='utf-8') as f:
        verses_data = json.load(f)

    async with async_session_maker() as session:
        print("Seeding Chapters...")
        for ch in chapters_data:
            stmt = insert(Chapter).values(
                chapter_number=ch['chapter_number'],
                title_sanskrit=ch['title_sanskrit'],
                title_transliteration=ch['title_transliteration'],
                title_english=ch['title_english'],
                title_hindi=ch.get('title_hindi'),
                summary_en=ch['summary_en'],
                summary_hi=ch.get('summary_hi'),
                total_verses=ch['total_verses'],
                themes=ch.get('themes')
            )
            # Idempotent: Update on conflict
            stmt = stmt.on_conflict_do_update(
                index_elements=['chapter_number'],
                set_={
                    'title_sanskrit': stmt.excluded.title_sanskrit,
                    'title_transliteration': stmt.excluded.title_transliteration,
                    'title_english': stmt.excluded.title_english,
                    'title_hindi': stmt.excluded.title_hindi,
                    'summary_en': stmt.excluded.summary_en,
                    'summary_hi': stmt.excluded.summary_hi,
                    'total_verses': stmt.excluded.total_verses,
                    'themes': stmt.excluded.themes,
                }
            )
            await session.execute(stmt)
        await session.commit()
        
        # We need to map chapter_number to chapter_id for verses
        result = await session.execute(select(Chapter.id, Chapter.chapter_number))
        chapter_map = {num: ch_id for ch_id, num in result.all()}
        
        print("Seeding Verses...")
        for v in verses_data:
            stmt = insert(Verse).values(
                chapter_id=chapter_map[v['chapter_number']],
                chapter_number=v['chapter_number'],
                verse_number=v['verse_number'],
                verse_key=f"{v['chapter_number']}.{v['verse_number']}",
                sanskrit=v['sanskrit'],
                transliteration=v.get('transliteration', ''),
                translation_en=v.get('translation_en', ''),
                translation_hi=v.get('translation_hi'),
                explanation_en=v.get('explanation_en'),
                explanation_hi=v.get('explanation_hi'),
                context_en=v.get('context_en'),
                context_hi=v.get('context_hi'),
                topics=v.get('topics'),
                concepts=v.get('concepts'),
                emotions=v.get('emotions'),
                life_situations=v.get('life_situations'),
                keywords=v.get('keywords')
            )
            # Idempotent: Update on conflict
            stmt = stmt.on_conflict_do_update(
                index_elements=['verse_key'],
                set_={
                    'sanskrit': stmt.excluded.sanskrit,
                    'transliteration': stmt.excluded.transliteration,
                    'translation_en': stmt.excluded.translation_en,
                    'translation_hi': stmt.excluded.translation_hi,
                    'explanation_en': stmt.excluded.explanation_en,
                    'explanation_hi': stmt.excluded.explanation_hi,
                    'topics': stmt.excluded.topics,
                    'concepts': stmt.excluded.concepts,
                    'emotions': stmt.excluded.emotions,
                    'life_situations': stmt.excluded.life_situations,
                    'keywords': stmt.excluded.keywords,
                }
            )
            await session.execute(stmt)
        await session.commit()

        # Seed pre-computed embeddings if embeddings.json exists
        embeddings_path = os.path.join(RAW_DIR, 'embeddings.json')
        if os.path.exists(embeddings_path):
            from app.models.rag import GitaEmbedding
            print("Seeding Pre-computed Embeddings...")
            with open(embeddings_path, 'r', encoding='utf-8') as f:
                embeddings_data = json.load(f)
            
            result = await session.execute(select(Verse.id, Verse.verse_key))
            verse_map = {vk: vid for vid, vk in result.all()}
            
            for emb in embeddings_data:
                v_id = verse_map.get(emb['verse_key'])
                if v_id:
                    emb_stmt = insert(GitaEmbedding).values(
                        verse_id=v_id,
                        embedding=emb['embedding'],
                        embedding_model=emb['embedding_model'],
                        embedding_version=emb['embedding_version'],
                        text_hash=emb['text_hash']
                    )
                    emb_stmt = emb_stmt.on_conflict_do_update(
                        index_elements=['verse_id'],
                        set_={
                            'embedding': emb_stmt.excluded.embedding,
                            'text_hash': emb_stmt.excluded.text_hash
                        }
                    )
                    await session.execute(emb_stmt)
            await session.commit()
            print(f"Seeded {len(embeddings_data)} pre-computed embeddings successfully.")

        print("Database seed complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
