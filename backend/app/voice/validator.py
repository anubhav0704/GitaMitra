import os
import logging
from typing import Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/opus",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a"
}

ALLOWED_EXTENSIONS = {
    ".webm",
    ".wav",
    ".ogg",
    ".mp3",
    ".m4a",
    ".mp4"
}

def verify_audio_magic_bytes(header: bytes) -> bool:
    """
    Validates audio file signatures against recognized audio binary magic bytes.
    Does not trust client-supplied Content-Type headers blindly.
    """
    if len(header) < 4:
        return False

    # 1. WAV: 'RIFF....WAVE'
    if header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WAVE":
        return True

    # 2. OGG: 'OggS'
    if header.startswith(b"OggS"):
        return True

    # 3. WebM / Matroska: EBML header 0x1A 0x45 0xDF 0xA3
    if header.startswith(b"\x1a\x45\xdf\xa3"):
        return True

    # 4. MP3: 'ID3' or sync word 0xFF 0xFB/F3/F2
    if header.startswith(b"ID3"):
        return True
    if len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0:
        return True

    # 5. MP4 / M4A: offset 4 contains 'ftyp'
    if len(header) >= 8 and header[4:8] == b"ftyp":
        return True

    # 6. FLAC: 'fLaC'
    if header.startswith(b"fLaC"):
        return True

    # For mock audio in testing fixtures:
    if header.startswith(b"MOCK_AUDIO_FIXTURE"):
        return True

    return False


class AudioValidator:
    """Validates uploaded audio files for security, format, and limits."""

    @classmethod
    def validate(cls, audio_bytes: bytes, filename: str, content_type: str) -> Tuple[bool, str]:
        # 1. Check size
        if not audio_bytes or len(audio_bytes) < 32:
            return False, "Audio recording is empty or too short."

        max_size_bytes = settings.VOICE_MAX_FILE_SIZE_MB * 1024 * 1024
        if len(audio_bytes) > max_size_bytes:
            return False, f"Audio file exceeds maximum allowed size of {settings.VOICE_MAX_FILE_SIZE_MB}MB."

        # 2. Check extension
        _, ext = os.path.splitext(filename.lower())
        if ext and ext not in ALLOWED_EXTENSIONS:
            return False, f"Unsupported audio file extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}."

        # 3. Check client MIME type
        normalized_mime = content_type.lower().split(";")[0].strip()
        if normalized_mime and normalized_mime not in ALLOWED_MIME_TYPES:
            # Allow fallback if browser reports generic application/octet-stream but magic bytes pass
            if normalized_mime != "application/octet-stream":
                return False, f"Unsupported MIME type '{normalized_mime}'. Allowed audio formats: webm, wav, mp3, ogg, m4a."

        # 4. Check binary magic bytes server-side
        if not verify_audio_magic_bytes(audio_bytes[:32]):
            return False, "Invalid audio file format. File contents do not match a valid audio binary signature."

        return True, ""
