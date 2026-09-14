import pytest
import uuid
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.llm.prompt_builder import PromptBuilder
from app.llm.validator import ResponseValidator

# ----------------------------------------------------
# Unit Tests: Prompt Builder
# ----------------------------------------------------
def test_prompt_builder():
    system_prompt = PromptBuilder.load_system_prompt()
    assert "GitaMitra" in system_prompt
    assert "Shri Krishna" in system_prompt

    prompt = PromptBuilder.build_prompt(
        user_message="I feel stressed about my exams.",
        rag_context="Bhagavad Gita 2.47\nSanskrit:\nकर्मण्येवाधिकारस्ते\nTranslation:\nYour right is to work only.",
        conversation_history=[
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Namaste, how may I assist you?"}
        ]
    )
    assert "<gita_context>" in prompt
    assert "Bhagavad Gita 2.47" in prompt
    assert "<recent_conversation>" in prompt
    assert "Hello" in prompt
    assert "<user_question>" in prompt
    assert "I feel stressed about my exams." in prompt
    assert "<response_instructions>" in prompt


# ----------------------------------------------------
# Unit Tests: Response Validator
# ----------------------------------------------------
def test_response_validator_valid_reference():
    retrieved = [
        {"chapter": 2, "verse": 47, "sanskrit": "कर्मण्येवाधिकारस्ते...", "translation_en": "Your right is only to work..."}
    ]
    content = "As taught in Bhagavad Gita 2.47, you should focus on your action."
    is_valid, cleaned, refs, errors = ResponseValidator.validate(content, retrieved)
    assert is_valid is True
    assert len(errors) == 0
    assert len(refs) == 1
    assert refs[0]["reference"] == "Bhagavad Gita 2.47"


def test_response_validator_unretrieved_reference():
    retrieved = [
        {"chapter": 2, "verse": 47, "sanskrit": "कर्मण्येवाधिकारस्ते...", "translation_en": "Your right is only to work..."}
    ]
    # Mentions Chapter 4 Verse 7 which was NOT in retrieved context
    content = "Lord Krishna states in Bhagavad Gita 4.7 that whenever dharma declines he appears."
    is_valid, cleaned, refs, errors = ResponseValidator.validate(content, retrieved, strict=True)
    assert len(errors) > 0
    assert "Unretrieved verse citation: Bhagavad Gita 4.7" in errors[0]
    # Citation should be softened/cleaned
    assert "4.7" not in cleaned


def test_response_validator_deity_claim_rejected():
    retrieved = []
    content = "Do not worry, I am Lord Krishna and I am speaking directly to you."
    is_valid, cleaned, refs, errors = ResponseValidator.validate(content, retrieved)
    assert "Model claimed to be Shri Krishna or a deity." in errors
    assert "I am Lord Krishna" not in cleaned


# ----------------------------------------------------
# API Integration & Multi-User Isolation Tests
# ----------------------------------------------------
@pytest.mark.asyncio
async def test_conversation_crud_and_user_isolation():
    u1_id = uuid.uuid4().hex[:8]
    u2_id = uuid.uuid4().hex[:8]

    user1 = {"name": "User 1", "email": f"u1_{u1_id}@test.com", "password": "Password123!"}
    user2 = {"name": "User 2", "email": f"u2_{u2_id}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client1:
        # Register and login User 1
        await client1.post("/api/auth/register", json=user1)
        login_res1 = await client1.post("/api/auth/login", json={"email": user1["email"], "password": user1["password"]})
        assert login_res1.status_code == 200

        # Create Conversation for User 1
        res_conv = await client1.post("/api/conversations", json={"title": "Career Dilemma"})
        assert res_conv.status_code in (200, 201)
        conv_data = res_conv.json()
        conv_id = conv_data["id"]
        assert conv_data["title"] == "Career Dilemma"

        # List conversations for User 1
        res_list = await client1.get("/api/conversations")
        assert res_list.status_code == 200
        assert any(c["id"] == conv_id for c in res_list.json())

        # Get conversation detail
        res_detail = await client1.get(f"/api/conversations/{conv_id}")
        assert res_detail.status_code == 200
        assert res_detail.json()["id"] == conv_id

        # Now test User 2
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client2:
            await client2.post("/api/auth/register", json=user2)
            await client2.post("/api/auth/login", json={"email": user2["email"], "password": user2["password"]})

            # User 2 tries to access User 1's conversation -> MUST return 404
            res_u2_get = await client2.get(f"/api/conversations/{conv_id}")
            assert res_u2_get.status_code == 404

            # User 2 tries to delete User 1's conversation -> MUST return 404
            res_u2_del = await client2.delete(f"/api/conversations/{conv_id}")
            assert res_u2_del.status_code == 404

        # User 1 deletes their own conversation -> 204
        res_del = await client1.delete(f"/api/conversations/{conv_id}")
        assert res_del.status_code == 204

        # Verify it is deleted
        res_get_deleted = await client1.get(f"/api/conversations/{conv_id}")
        assert res_get_deleted.status_code == 404


@pytest.mark.asyncio
async def test_chat_non_streaming_and_streaming():
    unique_id = uuid.uuid4().hex[:8]
    user = {"name": "Seeker", "email": f"seeker_{unique_id}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register and login
        await client.post("/api/auth/register", json=user)
        login_res = await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})
        assert login_res.status_code == 200

        # 1. Non-streaming Chat Request
        payload = {
            "message": "I feel afraid of failing my upcoming examination. How should I focus on my duty?"
        }
        res_chat = await client.post("/api/chat", json=payload)
        if res_chat.status_code != 200:
            print("CHAT ERROR RESPONSE:", res_chat.status_code, res_chat.text)
        assert res_chat.status_code == 200
        data = res_chat.json()
        assert "conversation_id" in data
        assert "user_message_id" in data
        assert "assistant_message_id" in data
        assert len(data["response"]) > 20
        assert isinstance(data["references"], list)
        conv_id = data["conversation_id"]

        # Verify messages are saved in conversation history
        res_conv = await client.get(f"/api/conversations/{conv_id}")
        assert res_conv.status_code == 200
        messages = res_conv.json()["messages"]
        assert len(messages) >= 2
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"

        # 2. Streaming Chat Request (SSE)
        stream_payload = {
            "message": "How do I control anger and bring stillness to the mind?",
            "conversation_id": conv_id
        }
        res_stream = await client.post("/api/chat/stream", json=stream_payload)
        assert res_stream.status_code == 200
        assert "text/event-stream" in res_stream.headers["content-type"]
        
        body_text = res_stream.text
        assert "event: init" in body_text
        assert "event: retrieval" in body_text
        assert "event: token" in body_text
        assert "event: complete" in body_text
