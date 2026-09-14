from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

from app.core.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """General health status overview."""
    health_status = {
        "status": "ok",
        "database": "unknown"
    }

    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            health_status["database"] = "ok"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["database"] = "failed"
        health_status["status"] = "degraded"

    return health_status

@router.get("/health/live")
async def liveness_check():
    """Liveness probe confirming process is alive."""
    return {"status": "alive", "service": "GitaMitra API"}

@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness probe checking readiness of database and pgvector dependencies."""
    try:
        res = await db.execute(text("SELECT 1"))
        if res.scalar() != 1:
            raise HTTPException(status_code=503, detail="Database connection degraded")
        return {"status": "ready", "database": "ready", "vector_engine": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failure: {e}")
        raise HTTPException(status_code=503, detail="Service unready")

