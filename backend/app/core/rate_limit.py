import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from app.core.config import settings

class InMemRateLimiter:
    """In-memory sliding window rate limiter for FastAPI endpoints."""
    def __init__(self):
        self.requests: Dict[str, list] = {}

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int]:
        now = time.time()
        timestamps = self.requests.get(key, [])
        # Filter timestamps outside window
        timestamps = [ts for ts in timestamps if now - ts < window_seconds]
        
        if len(timestamps) >= max_requests:
            retry_after = int(window_seconds - (now - timestamps[0]))
            return False, max(1, retry_after)
        
        timestamps.append(now)
        self.requests[key] = timestamps
        return True, 0

rate_limiter = InMemRateLimiter()

def check_rate_limit(request: Request, rate_limit_str: str, route_name: str = "endpoint"):
    """Validates rate limit for a request based on client IP or user ID."""
    if not settings.RATE_LIMIT_ENABLED:
        return

    # Parse limit string like "10/minute"
    try:
        parts = rate_limit_str.split("/")
        max_req = int(parts[0])
        unit = parts[1].lower()
        window = 60 if "min" in unit else (3600 if "hour" in unit else 1)
    except Exception:
        max_req = 30
        window = 60

    # Determine identity (User ID if authenticated, or Client IP)
    client_ip = request.client.host if request.client else "unknown"
    user_id = getattr(request.state, "user_id", None)
    identifier = f"{route_name}:{user_id or client_ip}"

    allowed, retry_after = rate_limiter.is_allowed(identifier, max_req, window)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for {route_name}. Please retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )
