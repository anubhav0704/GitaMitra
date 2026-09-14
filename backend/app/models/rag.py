from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.models.base import Base
from app.models.gita import Verse

class GitaEmbedding(Base):
    __tablename__ = "gita_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    verse_id: Mapped[int] = mapped_column(Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # PGVector column - dimension will be specified in Alembic depending on the model (e.g. 384 for all-MiniLM-L6-v2)
    embedding = mapped_column(Vector(384), nullable=False)
    
    embedding_model: Mapped[str] = mapped_column(String, nullable=False)
    embedding_version: Mapped[str] = mapped_column(String, nullable=False, default="1.0")
    
    text_hash: Mapped[str] = mapped_column(String, nullable=False, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    verse: Mapped["Verse"] = relationship("Verse")
