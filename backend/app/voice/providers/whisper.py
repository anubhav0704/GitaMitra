import logging
import httpx
from typing import Optional
from app.voice.base import STTProvider, STTResponse

logger = logging.getLogger(__name__)

class WhisperSTTProvider(STTProvider):
    """
    STT Provider for Groq Whisper and OpenAI Whisper APIs.
    Both use identical OpenAI-compatible multipart audio transcriptions API.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.groq.com/openai/v1",
        model: str = "whisper-large-v3",
        provider_name: str = "groq"
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.provider_name = provider_name

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm",
        language: Optional[str] = None
    ) -> STTResponse:
        url = f"{self.base_url}/audio/transcriptions"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        # Form fields
        data = {
            "model": self.model,
            "response_format": "verbose_json"
        }
        
        # If user explicitly selected Hindi or English, hint the model
        if language and language.lower() in ("hi", "hindi"):
            data["language"] = "hi"
        elif language and language.lower() in ("en", "english"):
            data["language"] = "en"

        # Provide a spiritual prompt hint so Whisper recognizes Sanskrit and Hindi terminology accurately
        data["prompt"] = "Bhagavad Gita, Krishna, Arjuna, dharma, karma, yoga, shloka, peace, duty, seeker."

        # Prepare multipart files
        files = {
            "file": (filename, audio_bytes, content_type)
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Calling {self.provider_name} Whisper at {url} (model={self.model}, size={len(audio_bytes)}B)")
                response = await client.post(url, headers=headers, data=data, files=files)

                if response.status_code != 200:
                    error_detail = response.text[:300]
                    logger.error(f"{self.provider_name} STT error ({response.status_code}): {error_detail}")
                    raise RuntimeError(f"{self.provider_name} speech transcription failed: {error_detail}")

                result = response.json()
                transcribed_text = result.get("text", "").strip()
                detected_lang = result.get("language", language or "en")
                duration = float(result.get("duration", 0.0) or 0.0)

                # Segment confidence average if present
                segments = result.get("segments", [])
                confidence = 0.95
                if segments and "avg_logprob" in segments[0]:
                    # Convert avg_logprob to approximate confidence percentage
                    avg_logprob = segments[0]["avg_logprob"]
                    confidence = max(0.5, min(1.0, round(1.0 + (avg_logprob / 3.0), 2)))

                return STTResponse(
                    text=transcribed_text,
                    language=detected_lang,
                    duration_seconds=duration,
                    confidence=confidence,
                    provider=self.provider_name,
                    model=self.model,
                    metadata={"segments_count": len(segments)}
                )

        except httpx.TimeoutException:
            logger.error(f"{self.provider_name} STT request timed out")
            raise TimeoutError(f"{self.provider_name} STT transcription timed out. Please try again.")
        except Exception as e:
            logger.error(f"WhisperSTTProvider failed: {e}", exc_info=True)
            raise
