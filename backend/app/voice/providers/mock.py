import io
import math
import struct
import wave
import logging
from typing import AsyncGenerator, Optional
from app.voice.base import STTProvider, TTSProvider, STTResponse, TTSResponse

logger = logging.getLogger(__name__)

def generate_mock_wav_bytes(duration_seconds: float = 1.0, frequency_hz: float = 432.0, sample_rate: int = 22050) -> bytes:
    """Generate a clean, valid PCM 16-bit WAV in memory with a soft meditative sine tone."""
    total_samples = int(sample_rate * max(0.2, min(duration_seconds, 10.0)))
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(total_samples):
            # Gentle bell envelope (calm spiritual tone)
            decay = math.exp(-3.0 * i / total_samples)
            sample_val = int(32767.0 * 0.3 * decay * math.sin(2.0 * math.pi * frequency_hz * (i / sample_rate)))
            frames.extend(struct.pack("<h", max(-32768, min(32767, sample_val))))
        
        wav_file.writeframes(frames)
    return buffer.getvalue()


class MockSTTProvider(STTProvider):
    """Deterministic Mock STT provider for automated testing and offline development."""

    def __init__(self, default_text: Optional[str] = None):
        self.default_text = default_text

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm",
        language: Optional[str] = None
    ) -> STTResponse:
        logger.info(f"MockSTTProvider transcribing {len(audio_bytes)} bytes (filename={filename}, lang={language})")
        
        # Check for test triggers inside audio or language
        text = self.default_text
        detected_lang = language or "en"

        if not text:
            # Check for simulated test markers or payload hints
            if b"CRISIS_TEST_MARKER" in audio_bytes or b"self_harm" in audio_bytes:
                text = "I feel hopeless and I want to end my life."
            elif b"HINDI_TEST_MARKER" in audio_bytes or language == "hi":
                text = "मुझे अपने करियर को लेकर बहुत चिंता हो रही है।"
                detected_lang = "hi"
            elif b"HINGLISH_TEST_MARKER" in audio_bytes:
                text = "Mujhe apne career ko lekar bahut tension ho rahi hai."
                detected_lang = "hi"
            elif b"INTERVIEW_FEAR_MARKER" in audio_bytes:
                text = "I failed my previous interview and I have another one tomorrow. I'm terrified that I'll fail again."
            else:
                text = "I am worried about my exam results and looking for spiritual guidance."

        duration = max(1.5, round(len(audio_bytes) / 16000.0, 2))
        return STTResponse(
            text=text,
            language=detected_lang,
            duration_seconds=duration,
            confidence=0.98,
            provider="mock",
            model="mock-whisper-v1"
        )


class MockTTSProvider(TTSProvider):
    """Deterministic Mock TTS provider that produces real, valid WAV audio bytes."""

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> TTSResponse:
        logger.info(f"MockTTSProvider synthesizing {len(text)} chars (voice={voice}, speed={speed})")
        # Approximate duration from word count (~150 words per minute)
        words = len(text.split())
        duration = max(0.5, round(words / (2.5 * (speed or 1.0)), 2))
        
        audio = generate_mock_wav_bytes(duration_seconds=min(duration, 3.0), frequency_hz=432.0)
        return TTSResponse(
            audio_bytes=audio,
            content_type="audio/wav",
            duration_seconds=duration,
            voice=voice or "onyx",
            provider="mock"
        )

    async def stream_synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        speed: Optional[float] = 1.0
    ) -> AsyncGenerator[bytes, None]:
        resp = await self.synthesize(text=text, voice=voice, language=language, speed=speed)
        # Yield in 4KB chunks
        chunk_size = 4096
        for i in range(0, len(resp.audio_bytes), chunk_size):
            yield resp.audio_bytes[i:i + chunk_size]
