import logging
import httpx
from typing import AsyncGenerator, Optional
from app.voice.base import TTSProvider, TTSResponse

logger = logging.getLogger(__name__)

class ElevenLabsTTSProvider(TTSProvider):
    """TTS Provider using ElevenLabs Multilingual Speech API."""

    def __init__(
        self,
        api_key: str,
        default_voice_id: str = "21m00Tcm4TlvDq8ikWAM", # Default calm voice
        model_id: str = "eleven_multilingual_v2"
    ):
        self.api_key = api_key
        self.default_voice_id = default_voice_id
        self.model_id = model_id
        self.base_url = "https://api.elevenlabs.io/v1/text-to-speech"

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> TTSResponse:
        voice_id = voice or self.default_voice_id
        url = f"{self.base_url}/{voice_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        payload = {
            "text": text,
            "model_id": self.model_id,
            "voice_settings": {
                "stability": 0.65,
                "similarity_boost": 0.8
            }
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                logger.info(f"Synthesizing speech via ElevenLabs (voice={voice_id}, chars={len(text)})")
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    err_text = response.text[:300]
                    raise RuntimeError(f"ElevenLabs TTS failed ({response.status_code}): {err_text}")

                audio = response.content
                words = len(text.split())
                approx_duration = max(0.5, round(words / 2.5, 2))
                return TTSResponse(
                    audio_bytes=audio,
                    content_type="audio/mpeg",
                    duration_seconds=approx_duration,
                    voice=voice_id,
                    provider="elevenlabs"
                )
        except Exception as e:
            logger.error(f"ElevenLabsTTSProvider failed: {e}", exc_info=True)
            raise

    async def stream_synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> AsyncGenerator[bytes, None]:
        voice_id = voice or self.default_voice_id
        url = f"{self.base_url}/{voice_id}/stream"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        payload = {
            "text": text,
            "model_id": self.model_id
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    raise RuntimeError(f"ElevenLabs stream failed ({response.status_code}): {err.decode()[:300]}")
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk
