import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_gita_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/status")
        assert response.status_code == 200
        data = response.json()
        assert data["chapters"] == 18
        assert data["verses"] == 700
        assert data["status"] == "ready"

@pytest.mark.asyncio
async def test_get_chapters():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/chapters")
        assert response.status_code == 200
        chapters = response.json()
        assert len(chapters) == 18
        assert chapters[0]["chapter_number"] == 1
        assert chapters[1]["chapter_number"] == 2
        assert "title_english" in chapters[0]

@pytest.mark.asyncio
async def test_get_chapter():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/chapters/2")
        assert response.status_code == 200
        chapter = response.json()
        assert chapter["chapter_number"] == 2
        assert chapter["total_verses"] == 72

@pytest.mark.asyncio
async def test_get_chapter_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/chapters/19")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_chapter_verses():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/chapters/2/verses")
        assert response.status_code == 200
        verses = response.json()
        assert len(verses) == 72
        assert verses[0]["verse_number"] == 1
        assert verses[0]["chapter_number"] == 2

@pytest.mark.asyncio
async def test_get_verse():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/verses/2/47")
        assert response.status_code == 200
        verse = response.json()
        assert verse["chapter_number"] == 2
        assert verse["verse_number"] == 47
        assert verse["verse_key"] == "2.47"
        assert "sanskrit" in verse

@pytest.mark.asyncio
async def test_get_verse_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/verses/2/100")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_search_verses():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/search?q=karma_yoga")
        assert response.status_code == 200
        results = response.json()
        assert len(results) > 0
        # Every returned verse should match the mock dataset condition where we injected karma_yoga in concepts
        assert any("karma_yoga" in verse.get("concepts", []) for verse in results)

@pytest.mark.asyncio
async def test_search_verses_short_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/gita/search?q=k")
        assert response.status_code == 422
