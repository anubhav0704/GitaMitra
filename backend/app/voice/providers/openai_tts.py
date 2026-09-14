import logging
import httpx
from typing import AsyncGenerator, Optional
from app.voice.base import TTSProvider, TTSResponse

logger = logging.getLogger(__name__)

class OpenAITTSProvider(TTSProvider):
    """
    TTS Provider using OpenAI Audio Speech API (/v1/audio/speech).
    Voices: alloy, echo, fable, onyx, nova, shimmer.
    Default: 'onyx' for a calm, resonant, peaceful spiritual companion tone.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        model: str = "tts-1",
        default_voice: str = "onyx"
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.default_voice = default_voice

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> TTSResponse:
        url = f"{self.base_url}/audio/speech"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        selected_voice = voice or self.default_voice
        clamped_speed = max(0.5, min(2.0, speed or 1.0))

        payload = {
            "model": self.model,
            "input": text,
            "voice": selected_voice,
            "response_format": "mp3",
            "speed": clamped_speed
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                logger.info(f"Synthesizing speech via OpenAI TTS (voice={selected_voice}, speed={clamped_speed}, chars={len(text)})")
                response = await client.post(url, headers=headers, json=payload)

                if response.status_code != 200:
                    err_msg = response.text[:300]
                    logger.error(f"OpenAI TTS error ({response.status_code}): {err_msg}")
                    raise RuntimeError(f"OpenAI speech synthesis failed: {err_msg}")

                audio_bytes = response.content
                words = len(text.split())
                approx_duration = max(0.5, round(words / (2.5 * clamped_speed), 2))

                return TTSResponse(
                    audio_bytes=audio_bytes,
                    content_type="audio/mpeg",
                    duration_seconds=approx_duration,
                    voice=selected_voice,
                    provider="openai"
                )

        except httpx.TimeoutException:
            logger.error("OpenAI TTS timed out")
            raise TimeoutError("Text-to-speech synthesis timed out. Please try again.")
        except Exception as e:
            logger.error(f"OpenAITTSProvider failed: {e}", exc_info=True)
            raise

    async def stream_synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> AsyncGenerator[bytes, None]:
        url = f"{self.base_url}/audio/speech"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        selected_voice = voice or self.default_voice
        clamped_speed = max(0.5, min(2.0, speed or 1.0))

        payload = {
            "model": self.model,
            "input": text,
            "voice": selected_voice,
            "response_format": "mp3",
            "speed": clamped_speed
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    raise RuntimeError(f"OpenAI TTS streaming failed ({response.status_code}): {err_body.decode()[:300]}")

                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk
