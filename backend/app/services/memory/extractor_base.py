import re
from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MemoryType(str, Enum):
    PROFILE = "PROFILE"
    GOAL = "GOAL"
    EVENT = "EVENT"
    PREFERENCE = "PREFERENCE"
    CHALLENGE = "CHALLENGE"
    CONTEXT = "CONTEXT"


class ExtractedMemoryItem(BaseModel):
    type: MemoryType
    content: str = Field(..., min_length=3, max_length=1000)
    summary: Optional[str] = Field(None, max_length=255)
    importance: int = Field(default=3, ge=1, le=5)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MemoryExtractionResult(BaseModel):
    should_remember: bool = False
    memories: List[ExtractedMemoryItem] = Field(default_factory=list)


def sanitize_sensitive_content(text: str) -> str:
    """
    Filters or redacts obvious credentials, tokens, passwords, and sensitive keys.
    Prevents storage of accidental secrets in long-term memory.
    """
    if not text:
        return text

    # Redact passwords, tokens, API keys (e.g. gsk_..., sk-..., Bearer ...)
    patterns = [
        (r'(?i)\b(?:password|passwd|pwd)\s*[:=]\s*\S+', '[REDACTED_PASSWORD]'),
        (r'\b(?:gsk_|sk-|eyJh|Bearer\s+)[A-Za-z0-9_\-\.]{15,}\b', '[REDACTED_TOKEN]'),
        (r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '[REDACTED_CARD]'),
        (r'(?i)\b(?:api[_-]?key|secret[_-]?key)\s*[:=]\s*\S+', '[REDACTED_KEY]')
    ]

    sanitized = text
    for pattern, replacement in patterns:
        sanitized = re.sub(pattern, replacement, sanitized)
    return sanitized


class MemoryExtractor(ABC):
    """Abstract interface for extracting candidate long-term memories from conversation turns."""

    @abstractmethod
    async def extract(
        self,
        user_message: str,
        assistant_message: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> MemoryExtractionResult:
        """Extract candidate memories from the current turn."""
        pass
