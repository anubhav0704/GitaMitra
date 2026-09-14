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

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Automatically create all PostgreSQL database tables before tests run."""
    async def init_models():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    loop = asyncio.get_event_loop_policy().new_event_loop()
    loop.run_until_complete(init_models())
    loop.close()
    yield
