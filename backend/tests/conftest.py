import pytest
import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["TESTING"] = "true"

from app.core.database import engine
from app.models.base import Base
import app.models.domain
import app.models.gita
import app.models.rag

from sqlalchemy import text

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Automatically create pgvector extension and all PostgreSQL database tables before tests run."""
    async def init_models():
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()
    
    asyncio.run(init_models())
    yield
    asyncio.run(engine.dispose())

