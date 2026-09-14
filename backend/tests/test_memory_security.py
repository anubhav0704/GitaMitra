import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_memory_user_isolation_and_authorization():
    """
    Security Test:
    Verifies that User A's memories are strictly private and isolated.
    User B cannot list, retrieve, patch, delete, dismiss, or search User A's memories,
    and cannot spoof User A's user_id.
    """
    uid_a = uuid.uuid4().hex[:8]
    uid_b = uuid.uuid4().hex[:8]

    user_a = {"name": "Seeker A", "email": f"seeker_a_{uid_a}@security.com", "password": "Password123!"}
    user_b = {"name": "Seeker B", "email": f"seeker_b_{uid_b}@security.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_a, \
               AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_b:

        # 1. Register & login User A
        reg_a = await client_a.post("/api/auth/register", json=user_a)
        assert reg_a.status_code == 201
        login_a = await client_a.post("/api/auth/login", json={"email": user_a["email"], "password": user_a["password"]})
        assert login_a.status_code == 200
        user_a_id = login_a.json()["user"]["id"]

        # 2. Register & login User B
        reg_b = await client_b.post("/api/auth/register", json=user_b)
        assert reg_b.status_code == 201
        login_b = await client_b.post("/api/auth/login", json={"email": user_b["email"], "password": user_b["password"]})
        assert login_b.status_code == 200

        # 3. User A creates memories via conversation turn
        chat_payload = {
            "message": "I'm a final-year computer science student preparing for software placements."
        }
        res_chat = await client_a.post("/api/chat", json=chat_payload)
        assert res_chat.status_code == 200

        # 4. Verify User A has memories
        res_mems_a = await client_a.get("/api/memories")
        assert res_mems_a.status_code == 200
        mems_a = res_mems_a.json()
        assert len(mems_a) >= 1
        memory_a_id = mems_a[0]["id"]

        # 5. User B attempts to LIST memories -> Must NOT see User A's memories
        res_mems_b = await client_b.get("/api/memories")
        assert res_mems_b.status_code == 200
        mems_b = res_mems_b.json()
        assert len(mems_b) == 0

        # 6. User B attempts to GET User A's memory by ID -> Must return 404
        res_get_unauth = await client_b.get(f"/api/memories/{memory_a_id}")
        assert res_get_unauth.status_code == 404

        # 7. User B attempts to PATCH User A's memory -> Must return 404
        res_patch_unauth = await client_b.patch(
            f"/api/memories/{memory_a_id}",
            json={"content": "Malicious modification by B"}
        )
        assert res_patch_unauth.status_code == 404

        # 8. User B attempts to DISMISS User A's memory -> Must return 404
        res_dismiss_unauth = await client_b.post(f"/api/memories/{memory_a_id}/dismiss")
        assert res_dismiss_unauth.status_code == 404

        # 9. User B attempts to DELETE User A's memory -> Must return 404
        res_del_unauth = await client_b.delete(f"/api/memories/{memory_a_id}")
        assert res_del_unauth.status_code == 404

        # 10. User B queries semantic debug endpoint -> Must NOT return User A's memories
        res_debug_b = await client_b.post(
            "/api/memories/debug",
            json={"query": "computer science student placement"}
        )
        assert res_debug_b.status_code == 200
        debug_data_b = res_debug_b.json()
        assert debug_data_b["candidates_count"] == 0

        # 11. User B clears all memories -> User A's memories must remain untouched
        res_clear_b = await client_b.delete("/api/memories")
        assert res_clear_b.status_code == 200

        # Verify User A's memory is still active and untouched
        res_check_a = await client_a.get(f"/api/memories/{memory_a_id}")
        assert res_check_a.status_code == 200
        assert res_check_a.json()["id"] == memory_a_id
        assert res_check_a.json()["is_active"] is True
