import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.memory.rule_extractor import RuleBasedMemoryExtractor
from app.services.memory.extractor_base import MemoryType, sanitize_sensitive_content

@pytest.fixture(autouse=True)
def setup_mock_llm(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.LLM_PROVIDER", "mock")

@pytest.mark.asyncio
async def test_rule_based_extractor_unit():
    """Unit tests for rule-based memory extraction and filler/secret filtering."""
    extractor = RuleBasedMemoryExtractor()

    # 1. Profile & Goal
    res = await extractor.extract("I'm a final-year computer science student preparing for software placements.")
    assert res.should_remember is True
    types = [m.type for m in res.memories]
    assert MemoryType.PROFILE in types
    assert MemoryType.GOAL in types

    # 2. Event: Failure
    res_fail = await extractor.extract("I failed my interview today.")
    assert res_fail.should_remember is True
    assert any(m.type == MemoryType.EVENT and "failed" in m.content.lower() for m in res_fail.memories)

    # 3. Preference: Hindi
    res_pref = await extractor.extract("Please give answers in Hindi.")
    assert res_pref.should_remember is True
    assert any(m.type == MemoryType.PREFERENCE and "Hindi" in m.content for m in res_pref.memories)

    # 4. Challenge: Procrastination
    res_chal = await extractor.extract("I have been struggling with procrastination while studying.")
    assert res_chal.should_remember is True
    assert any(m.type == MemoryType.CHALLENGE and "procrastination" in m.content.lower() for m in res_chal.memories)

    # 5. Trivial / Filler / Generic questions -> Should NOT remember
    assert (await extractor.extract("Okay, thanks!")).should_remember is False
    assert (await extractor.extract("What is karma?")).should_remember is False
    assert (await extractor.extract("I'm tired today.")).should_remember is False

    # 6. Sensitive token sanitization
    sanitized = sanitize_sensitive_content("My password: MySuperPass123! and API key is gsk_1234567890abcdef1234567890.")
    assert "MySuperPass123!" not in sanitized
    assert "gsk_1234567890abcdef1234567890" not in sanitized
    assert "[REDACTED_PASSWORD]" in sanitized
    assert "[REDACTED_TOKEN]" in sanitized


@pytest.mark.asyncio
async def test_memory_settings_toggle():
    """Test disabling and re-enabling memory personalization."""
    uid = uuid.uuid4().hex[:8]
    user = {"name": "Toggle Seeker", "email": f"toggle_{uid}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        login_res = await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})
        assert login_res.status_code == 200

        # Verify initial setting
        s_res = await client.get("/api/memories/settings")
        assert s_res.status_code == 200
        assert s_res.json()["memory_enabled"] is True

        # Disable memory
        put_res = await client.put("/api/memories/settings", json={"memory_enabled": False})
        assert put_res.status_code == 200
        assert put_res.json()["memory_enabled"] is False

        # Send a message with memorable information
        await client.post("/api/chat", json={"message": "I am a medical student preparing for NEET PG."})

        # Verify no memory was created while disabled
        m_res = await client.get("/api/memories")
        assert m_res.status_code == 200
        assert len(m_res.json()) == 0

        # Re-enable memory
        await client.put("/api/memories/settings", json={"memory_enabled": True})
        await client.post("/api/chat", json={"message": "I am a medical student preparing for NEET PG."})

        # Verify memory created now
        m_res2 = await client.get("/api/memories")
        assert m_res2.status_code == 200
        assert len(m_res2.json()) >= 1


@pytest.mark.asyncio
async def test_step6_required_end_to_end_scenario():
    """
    Section 39 Required End-to-End Test:
    Conversation 1: "I'm a final-year computer science student preparing for software placements."
                    -> PROFILE and GOAL memories created
    Conversation 2: "I failed my interview today."
                    -> EVENT memory created
    Conversation 3: "I have another interview next week and I'm really scared."
                    -> All relevant memories retrieved, Gita RAG context attached,
                       LLM produces personalized compassionate guidance.
    User B login:   -> User A's memories completely inaccessible.
    """
    uid_a = uuid.uuid4().hex[:8]
    uid_b = uuid.uuid4().hex[:8]

    user_a = {"name": "Arjuna Student", "email": f"arjuna_{uid_a}@gitamitra.com", "password": "Password123!"}
    user_b = {"name": "Other Seeker", "email": f"other_{uid_b}@gitamitra.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_a, \
               AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_b:

        # 1. Register and Login User A
        await client_a.post("/api/auth/register", json=user_a)
        await client_a.post("/api/auth/login", json={"email": user_a["email"], "password": user_a["password"]})

        # ==========================================
        # CONVERSATION 1
        # ==========================================
        conv1_res = await client_a.post("/api/conversations", json={"title": "Placement Planning"})
        assert conv1_res.status_code in (200, 201)
        conv1_id = conv1_res.json()["id"]

        chat1_res = await client_a.post("/api/chat", json={
            "conversation_id": conv1_id,
            "message": "I'm a final-year computer science student preparing for software placements."
        })
        assert chat1_res.status_code == 200

        # Verify Conversation 1 memories: PROFILE and GOAL
        mems_after_conv1 = (await client_a.get("/api/memories")).json()
        assert len(mems_after_conv1) >= 2
        types_conv1 = {m["type"] for m in mems_after_conv1}
        assert "PROFILE" in types_conv1
        assert "GOAL" in types_conv1

        # ==========================================
        # CONVERSATION 2
        # ==========================================
        conv2_res = await client_a.post("/api/conversations", json={"title": "Interview Result"})
        assert conv2_res.status_code in (200, 201)
        conv2_id = conv2_res.json()["id"]

        chat2_res = await client_a.post("/api/chat", json={
            "conversation_id": conv2_id,
            "message": "I failed my interview today."
        })
        assert chat2_res.status_code == 200

        # Verify Conversation 2 memories: EVENT added
        mems_after_conv2 = (await client_a.get("/api/memories")).json()
        assert len(mems_after_conv2) >= 3
        types_conv2 = {m["type"] for m in mems_after_conv2}
        assert "EVENT" in types_conv2
        event_mem = next(m for m in mems_after_conv2 if m["type"] == "EVENT")
        assert "failed" in event_mem["content"].lower()

        # ==========================================
        # CONVERSATION 3
        # ==========================================
        conv3_res = await client_a.post("/api/conversations", json={"title": "Upcoming Interview Anxiety"})
        assert conv3_res.status_code in (200, 201)
        conv3_id = conv3_res.json()["id"]

        chat3_res = await client_a.post("/api/chat", json={
            "conversation_id": conv3_id,
            "message": "I have another interview next week and I'm really scared."
        })
        assert chat3_res.status_code == 200
        chat3_data = chat3_res.json()

        # Verify RAG context attached
        assert len(chat3_data["references"]) > 0
        assert chat3_data["has_relevant_context"] is True

        # Verify retrieved memories in chat3 response
        assert "memories" in chat3_data
        retrieved_mem_types = [m["type"] for m in chat3_data["memories"]]
        # Should retrieve placement goal / failed event / profile context
        assert len(retrieved_mem_types) > 0

        # Verify response content is substantial and grounded
        response_text = chat3_data["response"]
        assert len(response_text) > 50

        # ==========================================
        # USER B VERIFICATION (ISOLATION)
        # ==========================================
        await client_b.post("/api/auth/register", json=user_b)
        await client_b.post("/api/auth/login", json={"email": user_b["email"], "password": user_b["password"]})

        # Verify User B has zero memories
        mems_b = (await client_b.get("/api/memories")).json()
        assert len(mems_b) == 0

        # Verify User B cannot view User A's memories by ID
        for m in mems_after_conv2:
            unauth_res = await client_b.get(f"/api/memories/{m['id']}")
            assert unauth_res.status_code == 404
