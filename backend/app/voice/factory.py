import os
import logging
from app.core.config import settings
from app.voice.base import STTProvider, TTSProvider
from app.voice.providers.mock import MockSTTProvider, MockTTSProvider
from app.voice.providers.whisper import WhisperSTTProvider
from app.voice.providers.openai_tts import OpenAITTSProvider
from app.voice.providers.elevenlabs import ElevenLabsTTSProvider

logger = logging.getLogger(__name__)

def get_stt_provider() -> STTProvider:
    """Factory to return the configured Speech-to-Text provider."""
    provider_type = (settings.STT_PROVIDER or "mock").lower()
    
    # Check explicit keys or general keys
    stt_key = settings.STT_API_KEY or os.environ.get("STT_API_KEY")
    groq_key = getattr(settings, "GROQ_API_KEY", "") or os.environ.get("GROQ_API_KEY") or (stt_key if stt_key and stt_key.startswith("gsk_") else None)
    openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY") or (stt_key if stt_key and not stt_key.startswith("gsk_") else None)
    llm_key = settings.LLM_API_KEY or os.environ.get("LLM_API_KEY")

    if not groq_key and llm_key and llm_key.startswith("gsk_"):
        groq_key = llm_key

    # 1. Explicit Mock
    if provider_type == "mock":
        logger.info("Using MockSTTProvider")
        return MockSTTProvider()

    # 2. Groq Whisper (Blazing fast whisper-large-v3)
    if provider_type == "groq" or (groq_key and provider_type != "openai"):
        active_key = groq_key or stt_key
        if active_key:
            model = settings.STT_MODEL or "whisper-large-v3"
            logger.info(f"Using WhisperSTTProvider (Groq, model={model})")
            return WhisperSTTProvider(
                api_key=active_key,
                base_url="https://api.groq.com/openai/v1",
                model=model,
                provider_name="groq"
            )
        else:
            logger.warning("Groq STT requested but no API key found. Falling back to MockSTTProvider.")

    # 3. OpenAI Whisper
    if provider_type == "openai":
        active_key = openai_key or stt_key
        if active_key:
            model = settings.STT_MODEL or "whisper-1"
            logger.info(f"Using WhisperSTTProvider (OpenAI, model={model})")
            return WhisperSTTProvider(
                api_key=active_key,
                base_url="https://api.openai.com/v1",
                model=model,
                provider_name="openai"
            )
        else:
            logger.warning("OpenAI STT requested but no API key found. Falling back to MockSTTProvider.")

    logger.info("Falling back to MockSTTProvider")
    return MockSTTProvider()


def get_tts_provider() -> TTSProvider:
    """Factory to return the configured Text-to-Speech provider."""
    provider_type = (settings.TTS_PROVIDER or "mock").lower()

    tts_key = settings.TTS_API_KEY or os.environ.get("TTS_API_KEY")
    openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY") or tts_key
    elevenlabs_key = settings.ELEVENLABS_API_KEY or os.environ.get("ELEVENLABS_API_KEY")

    # 1. Explicit Mock
    if provider_type == "mock":
        return MockTTSProvider()

    # 2. OpenAI TTS
    if provider_type == "openai":
        if openai_key:
            logger.info(f"Using OpenAITTSProvider (model={settings.TTS_MODEL}, voice={settings.TTS_VOICE})")
            return OpenAITTSProvider(
                api_key=openai_key,
                model=settings.TTS_MODEL or "tts-1",
                default_voice=settings.TTS_VOICE or "onyx"
            )
        else:
            logger.warning("OpenAI TTS requested but no API key found. Falling back to MockTTSProvider.")

    # 3. ElevenLabs
    if provider_type == "elevenlabs":
        active_key = elevenlabs_key or tts_key
        if active_key:
            voice_id = settings.ELEVENLABS_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"
            logger.info(f"Using ElevenLabsTTSProvider (voice_id={voice_id})")
            return ElevenLabsTTSProvider(api_key=active_key, default_voice_id=voice_id)
        else:
            logger.warning("ElevenLabs TTS requested but no API key found. Falling back to MockTTSProvider.")

    logger.info("Defaulting to MockTTSProvider")
    return MockTTSProvider()
