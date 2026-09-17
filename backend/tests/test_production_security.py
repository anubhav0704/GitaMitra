import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.rate_limit import rate_limiter
from app.core.error_tracking import sanitize_log_message

client = TestClient(app)

def test_liveness_and_readiness_probes():
    """Verify production health monitoring probes."""
    live_res = client.get("/api/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "alive"

    ready_res = client.get("/api/health/ready")
    assert ready_res.status_code in [200, 503]

    # Test HEAD probes for keepalive monitors
    head_ready_res = client.head("/api/health/ready")
    assert head_ready_res.status_code == 200

    head_live_res = client.head("/api/health/live")
    assert head_live_res.status_code == 200

def test_security_headers():
    """Verify production security headers are set on API responses."""
    res = client.get("/api/health/live")
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"
    assert res.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "X-Request-ID" in res.headers

def test_rate_limiter_unit():
    """Verify in-memory rate limiting logic correctly identifies quota breaches."""
    test_key = f"test_user_{uuid.uuid4().hex}"
    
    # Allow 2 requests within window
    allowed1, retry1 = rate_limiter.is_allowed(test_key, max_requests=2, window_seconds=60)
    assert allowed1 is True
    
    allowed2, retry2 = rate_limiter.is_allowed(test_key, max_requests=2, window_seconds=60)
    assert allowed2 is True
    
    # 3rd request must be rejected
    allowed3, retry3 = rate_limiter.is_allowed(test_key, max_requests=2, window_seconds=60)
    assert allowed3 is False
    assert retry3 > 0

def test_log_redaction_unit():
    """Verify sensitive fields like passwords and bearer tokens are redacted from logs."""
    raw_log = 'User login failed with password="SecretPassword123" and token="eyJhbGciOi..."'
    sanitized = sanitize_log_message(raw_log)
    assert "SecretPassword123" not in sanitized
    assert "[REDACTED]" in sanitized

def test_admin_endpoint_unauthorized_rejection():
    """Verify non-authenticated/non-admin users are strictly blocked from admin routes."""
    res = client.get("/api/admin/metrics")
    assert res.status_code in [401, 403]
