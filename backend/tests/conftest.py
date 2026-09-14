import pytest
import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["TESTING"] = "true"

from sqlalchemy import text, select, func
from app.core.database import engine, async_session_maker
from app.models.base import Base
from app.models.gita import Chapter
import app.models.domain
import app.models.gita
import app.models.rag

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Automatically create pgvector extension, database tables, and seed scriptures before tests run."""
    async def init_models():
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.run_sync(Base.metadata.create_all)
        
        async with async_session_maker() as session:
            res = await session.execute(select(func.count(Chapter.id)))
            chapter_count = res.scalar() or 0
        
        if chapter_count < 18:
            from scripts.seed_gita import seed_data
            from scripts.generate_embeddings import generate_embeddings
            await seed_data()
            await generate_embeddings()
            
        await engine.dispose()
    
    asyncio.run(init_models())
    yield
    asyncio.run(engine.dispose())


