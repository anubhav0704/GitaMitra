from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY

from app.models.base import Base

class Chapter(Base):
    __tablename__ = "gita_chapters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    chapter_number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    title_sanskrit: Mapped[str] = mapped_column(String, nullable=False)
    title_transliteration: Mapped[str] = mapped_column(String, nullable=False)
    title_english: Mapped[str] = mapped_column(String, nullable=False)
    title_hindi: Mapped[str | None] = mapped_column(String, nullable=True)
    summary_en: Mapped[str] = mapped_column(Text, nullable=False)
    summary_hi: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_verses: Mapped[int] = mapped_column(Integer, nullable=False)
    themes: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    source_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    verses: Mapped[list["Verse"]] = relationship("Verse", back_populates="chapter", cascade="all, delete-orphan")

class Verse(Base):
    __tablename__ = "gita_verses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    chapter_id: Mapped[int] = mapped_column(Integer, ForeignKey("gita_chapters.id"), nullable=False)
    chapter_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    verse_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    verse_key: Mapped[str] = mapped_column(String, index=True, unique=True, nullable=False) # e.g. "2.47"
    
    sanskrit: Mapped[str] = mapped_column(Text, nullable=False)
    transliteration: Mapped[str] = mapped_column(Text, nullable=False)
    translation_en: Mapped[str] = mapped_column(Text, nullable=False)
    translation_hi: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_hi: Mapped[str | None] = mapped_column(Text, nullable=True)
    context_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    context_hi: Mapped[str | None] = mapped_column(Text, nullable=True)

    topics: Mapped[list[str] | None] = mapped_column(ARRAY(String), index=True, nullable=True)
    concepts: Mapped[list[str] | None] = mapped_column(ARRAY(String), index=True, nullable=True)
    emotions: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    life_situations: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String), index=True, nullable=True)

    source_name: Mapped[str | None] = mapped_column(String, nullable=True)
    source_reference: Mapped[str | None] = mapped_column(String, nullable=True)
    source_license: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    chapter: Mapped["Chapter"] = relationship("Chapter", back_populates="verses")
