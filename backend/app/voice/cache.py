import os
import hashlib
import json
import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class AudioCacheManager:
    """
    Deterministic user-isolated audio cache for assistant Text-to-Speech responses.
    Prevents repeated expensive TTS calls when a user replays an existing message.
    """

    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = cache_dir or getattr(settings, "VOICE_CACHE_DIR", "/tmp/gitamitra_voice_cache")
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
        except Exception as e:
            logger.warning(f"Could not create voice cache dir {self.cache_dir}: {e}")

    def _generate_key(self, user_id: str, text: str, voice: str, language: str, speed: float) -> str:
        data = f"{user_id}:{voice}:{speed:.2f}:{language}:{text.strip()}"
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def get(
        self,
        user_id: str,
        text: str,
        voice: str = "onyx",
        language: str = "en",
        speed: float = 1.0
    ) -> Optional[Tuple[bytes, str, float]]:
        if not getattr(settings, "VOICE_CACHE_ENABLED", True):
            return None

        key = self._generate_key(user_id, text, voice, language, speed)
        audio_file = os.path.join(self.cache_dir, f"{key}.bin")
        meta_file = os.path.join(self.cache_dir, f"{key}.json")

        if os.path.exists(audio_file) and os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                with open(audio_file, "rb") as f:
                    audio_bytes = f.read()

                logger.info(f"Audio cache HIT for key {key[:12]}")
                return audio_bytes, meta.get("content_type", "audio/mpeg"), meta.get("duration", 0.0)
            except Exception as e:
                logger.warning(f"Error reading audio cache: {e}")
                return None

        return None

    def set(
        self,
        user_id: str,
        text: str,
        voice: str,
        language: str,
        speed: float,
        audio_bytes: bytes,
        content_type: str = "audio/mpeg",
        duration_seconds: float = 0.0
    ) -> None:
        if not getattr(settings, "VOICE_CACHE_ENABLED", True):
            return

        key = self._generate_key(user_id, text, voice, language, speed)
        audio_file = os.path.join(self.cache_dir, f"{key}.bin")
        meta_file = os.path.join(self.cache_dir, f"{key}.json")

        try:
            with open(audio_file, "wb") as f:
                f.write(audio_bytes)
            with open(meta_file, "w", encoding="utf-8") as f:
                json.dump({
                    "content_type": content_type,
                    "duration": duration_seconds,
                    "voice": voice,
                    "user_id": user_id
                }, f)
            logger.info(f"Stored audio in cache for key {key[:12]} ({len(audio_bytes)}B)")
        except Exception as e:
            logger.warning(f"Failed to write audio cache: {e}")

    def clear_for_user(self, user_id: str) -> None:
        """Clear all cached audio belonging to a specific user."""
        try:
            for fname in os.listdir(self.cache_dir):
                if fname.endswith(".json"):
                    meta_path = os.path.join(self.cache_dir, fname)
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    if meta.get("user_id") == user_id:
                        os.remove(meta_path)
                        bin_path = meta_path.replace(".json", ".bin")
                        if os.path.exists(bin_path):
                            os.remove(bin_path)
        except Exception as e:
            logger.warning(f"Failed to clear user audio cache: {e}")
