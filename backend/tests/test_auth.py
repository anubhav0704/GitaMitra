import pytest
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app

@pytest.mark.asyncio
async def test_register_login_flow():
    # Use the real app instance. It will connect to the configured DB (dev DB).
    # We will generate a unique user to avoid conflicts with existing data.
    unique_id = uuid.uuid4().hex[:8]
    test_user = {
        "name": f"Test User {unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "strongpassword123"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Registration
        response = await client.post("/api/auth/register", json=test_user)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user["email"]
        assert "password_hash" not in data
        assert "id" in data

        # 2. Duplicate Registration
        response_dup = await client.post("/api/auth/register", json=test_user)
        assert response_dup.status_code == 409

        # 3. Login
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        response_login = await client.post("/api/auth/login", json=login_data)
        assert response_login.status_code == 200
        # Cookie should be set
        assert "access_token" in response_login.cookies

        # 4. Get Current User (/me)
        # Client automatically uses cookies from login
        response_me = await client.get("/api/auth/me")
        assert response_me.status_code == 200
        data_me = response_me.json()
        assert data_me["email"] == test_user["email"]
        assert "password_hash" not in data_me

        # 5. Logout
        response_logout = await client.post("/api/auth/logout")
        assert response_logout.status_code == 200
        # Cookie should be deleted or cleared
        assert not response_logout.cookies.get("access_token") or response_logout.cookies["access_token"] == ""

        # 6. Access without token
        response_unauth = await client.get("/api/auth/me")
        assert response_unauth.status_code == 401

@pytest.mark.asyncio
async def test_invalid_login():
    login_data = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/login", json=login_data)
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_authorization_isolation():
    # We need two separate clients to maintain separate cookie jars for two users
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_a:
        # Create User A
        user_a = {"name": "User A", "email": f"a_{uuid.uuid4().hex}@test.com", "password": "password123"}
        await client_a.post("/api/auth/register", json=user_a)
        await client_a.post("/api/auth/login", json={"email": user_a["email"], "password": user_a["password"]})
        
        # User A creates Conversation A
        res_conv_a = await client_a.post("/api/conversations?title=ConvA")
        assert res_conv_a.status_code == 200
        conv_a_id = res_conv_a.json()["id"]
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_b:
            # Create User B
            user_b = {"name": "User B", "email": f"b_{uuid.uuid4().hex}@test.com", "password": "password123"}
            await client_b.post("/api/auth/register", json=user_b)
            await client_b.post("/api/auth/login", json={"email": user_b["email"], "password": user_b["password"]})
            
            # User B attempts to access Conversation A
            res_b_access_a = await client_b.get(f"/api/conversations/{conv_a_id}")
            assert res_b_access_a.status_code == 404 # Should be 404 to not leak existence
            
        # User A accesses Conversation A
        res_a_access_a = await client_a.get(f"/api/conversations/{conv_a_id}")
        assert res_a_access_a.status_code == 200
        assert res_a_access_a.json()["id"] == conv_a_id

@pytest.mark.asyncio
async def test_change_password():
    unique_id = uuid.uuid4().hex[:8]
    user = {
        "name": f"Password Changer {unique_id}",
        "email": f"change_{unique_id}@example.com",
        "password": "oldPassword123"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})

        # Test invalid current password
        res_fail = await client.post("/api/auth/change-password", json={
            "current_password": "wrongPassword",
            "new_password": "newPassword123"
        })
        assert res_fail.status_code == 400

        # Test successful change
        res_success = await client.post("/api/auth/change-password", json={
            "current_password": "oldPassword123",
            "new_password": "newPassword123"
        })
        assert res_success.status_code == 200

        # Verify old password no longer works
        await client.post("/api/auth/logout")
        res_old_login = await client.post("/api/auth/login", json={"email": user["email"], "password": "oldPassword123"})
        assert res_old_login.status_code == 401

        # Verify new password works
        res_new_login = await client.post("/api/auth/login", json={"email": user["email"], "password": "newPassword123"})
        assert res_new_login.status_code == 200

