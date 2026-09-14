import logging
from typing import AsyncGenerator, Optional
from app.models.domain import User
from app.voice.base import STTResponse, TTSResponse, STTProvider, TTSProvider
from app.voice.factory import get_stt_provider, get_tts_provider
from app.voice.validator import AudioValidator
from app.voice.formatter import SpeechTextFormatter
from app.voice.cache import AudioCacheManager

logger = logging.getLogger(__name__)

class SpeechToTextService:
    """Service layer for speech transcription with validation and privacy safeguards."""

    def __init__(self, provider: Optional[STTProvider] = None):
        self.provider = provider or get_stt_provider()

    async def transcribe_audio(
        self,
        user: User,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm",
        language: Optional[str] = None
    ) -> STTResponse:
        # 1. Server-side validation
        is_valid, err_msg = AudioValidator.validate(audio_bytes, filename, content_type)
        if not is_valid:
            logger.warning(f"Audio validation rejected for user {user.id}: {err_msg}")
            raise ValueError(err_msg)

        # 2. Invoke STT provider
        logger.info(f"Initiating STT for user {user.id} ({len(audio_bytes)}B, {content_type})")
        stt_resp = await self.provider.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language=language
        )

        # 3. Privacy: raw audio is in memory / transient; ensure garbage collection
        del audio_bytes

        # 4. Check confidence
        if stt_resp.confidence < 0.4:
            logger.warning(f"Low transcription confidence ({stt_resp.confidence}) for user {user.id}")

        return stt_resp


class TextToSpeechService:
    """Service layer for speech synthesis with natural text formatting and audio caching."""

    def __init__(self, provider: Optional[TTSProvider] = None, cache_manager: Optional[AudioCacheManager] = None):
        self.provider = provider or get_tts_provider()
        self.cache = cache_manager or AudioCacheManager()

    async def synthesize_text(
        self,
        user: User,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> TTSResponse:
        # 1. Format text for natural spoken delivery
        clean_text = SpeechTextFormatter.format_for_speech(text)
        if not clean_text:
            clean_text = "I reflect upon your query in sacred silence."

        active_voice = voice or "onyx"
        active_lang = language or "en"
        active_speed = speed or 1.0

        # 2. Check deterministic audio cache
        cached = self.cache.get(
            user_id=str(user.id),
            text=clean_text,
            voice=active_voice,
            language=active_lang,
            speed=active_speed
        )
        if cached:
            audio_bytes, content_type, duration = cached
            return TTSResponse(
                audio_bytes=audio_bytes,
                content_type=content_type,
                duration_seconds=duration,
                voice=active_voice,
                provider="cache"
            )

        # 3. Cache miss: Synthesize through TTS provider
        logger.info(f"Synthesizing speech via provider for user {user.id} (chars={len(clean_text)})")
        tts_resp = await self.provider.synthesize(
            text=clean_text,
            voice=active_voice,
            language=active_lang,
            speed=active_speed
        )

        # 4. Store in user-isolated cache for replay
        self.cache.set(
            user_id=str(user.id),
            text=clean_text,
            voice=active_voice,
            language=active_lang,
            speed=active_speed,
            audio_bytes=tts_resp.audio_bytes,
            content_type=tts_resp.content_type,
            duration_seconds=tts_resp.duration_seconds
        )

        return tts_resp

    async def stream_synthesized_text(
        self,
        user: User,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> AsyncGenerator[bytes, None]:
        clean_text = SpeechTextFormatter.format_for_speech(text)
        async for chunk in self.provider.stream_synthesize(
            text=clean_text,
            voice=voice,
            language=language,
            speed=speed
        ):
            yield chunk
