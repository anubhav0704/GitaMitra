from contextlib import asynccontextmanager
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.endpoints import health, auth, conversations, gita, rag, chat, memories, feedback, voice, admin
from app.core.config import settings
from app.core.security import SecurityHeadersMiddleware
from app.core.metrics import metrics_collector
from app.core.database import engine
from app.models.base import Base
import app.models.domain # Ensure models are loaded

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gitamitra.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting GitaMitra Production API...")
    try:
        from sqlalchemy import text, select, func
        from app.models.gita import Chapter
        from app.core.database import async_session_maker
        
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.run_sync(Base.metadata.create_all)
            
        async with async_session_maker() as session:
            res = await session.execute(select(func.count(Chapter.id)))
            count = res.scalar() or 0
            
        if count < 18:
            logger.info("Empty scripture database detected. Auto-seeding Gita chapters, verses, and embeddings...")
            from scripts.seed_gita import seed_data
            from scripts.generate_embeddings import generate_embeddings
            await seed_data()
            await generate_embeddings()
            logger.info("Scripture seeding completed.")
    except Exception as e:
        logger.warning(f"Lifespan database setup exception: {e}")
    yield
    logger.info("Graceful shutdown: closing GitaMitra API resources...")

app = FastAPI(
    title="GitaMitra API",
    description="Production AI Spiritual Companion inspired by the Bhagavad Gita",
    version="1.0.0",
    lifespan=lifespan
)

# Add Security Headers & Request Tracing Pure ASGI Middlewares
app.add_middleware(SecurityHeadersMiddleware)

class RequestTracingMiddleware:
    """Pure ASGI middleware for Request ID tracing and metrics recording."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        request_id = uuid.uuid4().hex[:12]
        path = scope.get("path", "")

        async def send_with_tracing(message):
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
                duration_ms = (time.time() - start_time) * 1000
                metrics_collector.record_request(path, status_code, duration_ms)
                
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("utf-8")))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_tracing)

app.add_middleware(RequestTracingMiddleware)

# Configure CORS dynamically from settings
origins = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(feedback.router, prefix="/api/chat")
app.include_router(memories.router, prefix="/api")
app.include_router(gita.router, prefix="/api/gita", tags=["gita"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


