import asyncio
import os
import sys

# Add the app directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker
from app.models.gita import Verse
from app.models.rag import GitaEmbedding
from app.core.embeddings import get_embedding_provider

def format_canonical_verse_text(verse: Verse) -> str:
    """Build canonical text format for embedding, prioritizing semantic content."""
    parts = [f"Bhagavad Gita Chapter {verse.chapter_number}, Verse {verse.verse_number}"]
    
    if verse.translation_en:
        parts.append(f"Translation: {verse.translation_en}")
        
    if verse.topics:
        parts.append(f"Topics: {', '.join(verse.topics)}")
        
    if verse.concepts:
        parts.append(f"Concepts: {', '.join(verse.concepts)}")
        
    if verse.life_situations:
        parts.append(f"Life situations: {', '.join(verse.life_situations)}")
        
    if verse.emotions:
        parts.append(f"Emotions: {', '.join(verse.emotions)}")
        
    if verse.transliteration:
        parts.append(f"Transliteration: {verse.transliteration}")
        
    if verse.sanskrit:
        parts.append(f"Sanskrit: {verse.sanskrit}")
        
    return "\n".join(parts)

async def generate_embeddings():
    print("## Embedding Gita verses...\n")
    
    provider = get_embedding_provider()
    print(f"Using Embedding Provider: {provider.model_name} (Dim: {provider.dimension})")
    
    async with async_session_maker() as db:
        # Get all verses
        verses_result = await db.execute(select(Verse).order_by(Verse.id))
        all_verses = verses_result.scalars().all()
        
        total_verses = len(all_verses)
        
        # Get existing embeddings map
        embeddings_result = await db.execute(
            select(GitaEmbedding).where(
                GitaEmbedding.embedding_model == provider.model_name,
                GitaEmbedding.embedding_version == provider.version
            )
        )
        existing_embeddings = {emb.verse_id: emb for emb in embeddings_result.scalars().all()}
        
        already_embedded = 0
        to_embed = []
        
        for verse in all_verses:
            text = format_canonical_verse_text(verse)
            text_hash = provider.compute_hash(text)
            
            existing = existing_embeddings.get(verse.id)
            if existing and existing.text_hash == text_hash:
                already_embedded += 1
            else:
                to_embed.append((verse, text, text_hash, existing))
                
        print(f"Total verses: {total_verses}")
        print(f"Already embedded (unchanged): {already_embedded}")
        print(f"To embed: {len(to_embed)}")
        print("-" * 30)
        
        processed = 0
        failed = 0
        batch_size = 32
        
        for i in range(0, len(to_embed), batch_size):
            batch = to_embed[i:i+batch_size]
            texts = [item[1] for item in batch]
            
            try:
                embeddings = provider.get_embeddings(texts)
                
                for j, (verse, text, text_hash, existing) in enumerate(batch):
                    if existing:
                        existing.embedding = embeddings[j]
                        existing.text_hash = text_hash
                        # The dimensions, model, version stay the same because we matched them above
                    else:
                        new_embedding = GitaEmbedding(
                            verse_id=verse.id,
                            embedding=embeddings[j],
                            embedding_model=provider.model_name,
                            embedding_version=provider.version,
                            text_hash=text_hash
                        )
                        db.add(new_embedding)
                        
                await db.commit()
                processed += len(batch)
                print(f"Processed: {processed}/{len(to_embed)}")
            except Exception as e:
                print(f"Batch failed! Error: {e}")
                failed += len(batch)
                
        print("-" * 30)
        print(f"Successfully embedded: {processed}")
        print(f"Failed: {failed}")
        if failed == 0:
            print("Result: PASS")
        else:
            print("Result: FAIL")

if __name__ == "__main__":
    asyncio.run(generate_embeddings())
