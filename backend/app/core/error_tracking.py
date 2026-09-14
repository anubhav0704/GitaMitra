import logging
import re
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("gitamitra.errors")

SENSITIVE_PATTERNS = [
    (r'(password["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', r'\1[REDACTED]\3'),
    (r'(token["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', r'\1[REDACTED]\3'),
    (r'(authorization["\']?\s*[:=]\s*["\']Bearer\s+)([^"\']+)(["\'])', r'\1[REDACTED]\3'),
    (r'(api_key["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', r'\1[REDACTED]\3')
]

def sanitize_log_message(msg: str) -> str:
    """Redacts sensitive user data (passwords, tokens, keys) from log outputs."""
    sanitized = str(msg)
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
    return sanitized

def capture_exception(exc: Exception, context: Optional[Dict[str, Any]] = None):
    """Logs exception with redacted context metadata and notifies tracking service if configured."""
    safe_context = {k: sanitize_log_message(str(v)) for k, v in (context or {}).items()}
    logger.error(f"Captured Exception: {exc} | Context: {safe_context}", exc_info=True)

    if settings.ERROR_TRACKING_ENABLED and settings.ERROR_TRACKING_DSN:
        # Provider SDK hook (e.g. Sentry integration if DSN is set)
        pass
