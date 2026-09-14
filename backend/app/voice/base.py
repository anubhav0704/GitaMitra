from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, Dict, Any

class STTResponse:
    def __init__(
        self,
        text: str,
        language: str = "en",
        duration_seconds: float = 0.0,
        confidence: float = 1.0,
        provider: str = "",
        model: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.text = text
        self.language = language
        self.duration_seconds = duration_seconds
        self.confidence = confidence
        self.provider = provider
        self.model = model
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "language": self.language,
            "duration_seconds": self.duration_seconds,
            "confidence": self.confidence,
            "provider": self.provider,
            "model": self.model
        }


class TTSResponse:
    def __init__(
        self,
        audio_bytes: bytes,
        content_type: str = "audio/mpeg",
        duration_seconds: float = 0.0,
        voice: str = "onyx",
        provider: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.audio_bytes = audio_bytes
        self.content_type = content_type
        self.duration_seconds = duration_seconds
        self.voice = voice
        self.provider = provider
        self.metadata = metadata or {}


class STTProvider(ABC):
    """Abstract base class for all Speech-to-Text providers."""

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm",
        language: Optional[str] = None
    ) -> STTResponse:
        """Transcribe speech audio into normalized text."""
        pass


class TTSProvider(ABC):
    """Abstract base class for all Text-to-Speech providers."""

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> TTSResponse:
        """Synthesize text into complete audio bytes."""
        pass

    @abstractmethod
    async def stream_synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> AsyncGenerator[bytes, None]:
        """Stream synthesized audio chunks."""
        pass
