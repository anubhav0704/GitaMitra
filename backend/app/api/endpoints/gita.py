from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.core.database import get_db
from app.models.gita import Chapter, Verse
from pydantic import BaseModel, ConfigDict

router = APIRouter()

class ChapterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chapter_number: int
    title_sanskrit: str
    title_english: str
    title_hindi: Optional[str]
    summary_en: str
    summary_hi: Optional[str]
    total_verses: int
    themes: Optional[List[str]]

class VerseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chapter_number: int
    verse_number: int
    verse_key: str
    sanskrit: str
    transliteration: str
    translation_en: str
    translation_hi: Optional[str]
    explanation_en: Optional[str]
    explanation_hi: Optional[str]
    topics: Optional[List[str]]
    concepts: Optional[List[str]]
    emotions: Optional[List[str]]
    life_situations: Optional[List[str]]
    keywords: Optional[List[str]]

class SearchResult(BaseModel):
    verse: VerseOut

@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    result_ch = await db.execute(select(Chapter))
    chapters = result_ch.scalars().all()
    
    result_ve = await db.execute(select(Verse))
    verses = result_ve.scalars().all()
    
    return {
        "chapters": len(chapters),
        "verses": len(verses),
        "status": "ready" if len(chapters) == 18 and len(verses) == 700 else "incomplete",
        "dataset_version": "mock-v1"
    }

@router.get("/chapters", response_model=List[ChapterOut])
async def list_chapters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chapter).order_by(Chapter.chapter_number))
    return result.scalars().all()

@router.get("/chapters/{chapter_number}", response_model=ChapterOut)
async def get_chapter(chapter_number: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chapter).where(Chapter.chapter_number == chapter_number))
    chapter = result.scalars().first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter

@router.get("/chapters/{chapter_number}/verses", response_model=List[VerseOut])
async def list_chapter_verses(chapter_number: int, db: AsyncSession = Depends(get_db)):
    # Verify chapter exists
    result_ch = await db.execute(select(Chapter).where(Chapter.chapter_number == chapter_number))
    if not result_ch.scalars().first():
        raise HTTPException(status_code=404, detail="Chapter not found")

    result = await db.execute(
        select(Verse).where(Verse.chapter_number == chapter_number).order_by(Verse.verse_number)
    )
    return result.scalars().all()

@router.get("/verses/{chapter_number}/{verse_number}", response_model=VerseOut)
@router.get("/chapters/{chapter_number}/verses/{verse_number}", response_model=VerseOut)
async def get_verse(chapter_number: int, verse_number: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Verse).where(
            Verse.chapter_number == chapter_number,
            Verse.verse_number == verse_number
        )
    )
    verse = result.scalars().first()
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    return verse

from sqlalchemy import or_, String

# ... (down to where search_verses is defined)

@router.get("/search", response_model=List[VerseOut])
async def search_verses(
    q: str = Query(..., min_length=2, description="Search query"),
    db: AsyncSession = Depends(get_db)
):
    # Basic ILIKE search across text fields
    # Array fields require Postgres ANY or cast to text.
    search_term = f"%{q}%"
    result = await db.execute(
        select(Verse).where(
            or_(
                Verse.sanskrit.ilike(search_term),
                Verse.transliteration.ilike(search_term),
                Verse.translation_en.ilike(search_term),
                Verse.translation_hi.ilike(search_term),
                Verse.explanation_en.ilike(search_term),
                # To search within Postgres ARRAY safely via ILIKE on casted text representation:
                Verse.topics.cast(String).ilike(search_term),
                Verse.concepts.cast(String).ilike(search_term)
            )
        ).limit(50)
    )
    return result.scalars().all()
