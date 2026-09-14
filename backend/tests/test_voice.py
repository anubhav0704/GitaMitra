import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.voice.formatter import SpeechTextFormatter
from app.voice.validator import AudioValidator, verify_audio_magic_bytes
from app.voice.providers.mock import MockSTTProvider, MockTTSProvider, generate_mock_wav_bytes
from app.voice.cache import AudioCacheManager

# ==============================================================================
# Unit Tests: SpeechTextFormatter (Markdown & Sanskrit Handling)
# ==============================================================================
def test_speech_text_formatter_strips_markdown():
    raw = """
    ### Gita's Perspective
    **Namaste Seeker**, you must act with dedication.
    * Focus on your duty.
    * Do not cling to results.
    
    For more details, visit [Chapter 2](https://gitamitra.com).
    ```code block should be stripped```
    """
    clean = SpeechTextFormatter.format_for_speech(raw)
    assert "###" not in clean
    assert "**" not in clean
    assert "```" not in clean
    assert "Gita's Perspective" not in clean
    assert "Namaste Seeker" in clean
    assert "Focus on your duty" in clean
    assert "https://" not in clean

def test_speech_text_formatter_preserves_sanskrit():
    raw = """
    Lord Krishna declares in verse:
    कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
    मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥ (BG 2.47)
    
    You have a right only to work, never to its fruits.
    """
    clean = SpeechTextFormatter.format_for_speech(raw)
    # Sanskrit shloka is preserved
    assert "कर्मण्येवाधिकारस्ते" in clean
    assert "मा फलेषु कदाचन" in clean
    # Citation is cleanly removed
    assert "(BG 2.47)" not in clean
    assert "You have a right only to work" in clean

def test_speech_text_formatter_hindi_hinglish():
    raw = "**चिंता मत करो**, *life mein sab theek ho jayega*. Krishna says svadharma is essential."
    clean = SpeechTextFormatter.format_for_speech(raw)
    assert "**" not in clean
    assert "चिंता मत करो" in clean
    assert "life mein sab theek ho jayega" in clean

# ==============================================================================
# Unit Tests: AudioValidator & Magic Bytes
# ==============================================================================
def test_audio_validator_valid_wav():
    wav_bytes = generate_mock_wav_bytes(duration_seconds=1.0)
    is_valid, err = AudioValidator.validate(wav_bytes, "test.wav", "audio/wav")
    assert is_valid is True
    assert err == ""

def test_audio_validator_invalid_magic_bytes():
    fake_exe = b"MZ\x90\x00" + b"\x00" * 100
    is_valid, err = AudioValidator.validate(fake_exe, "malicious.wav", "audio/wav")
    assert is_valid is False
    assert "Invalid audio file format" in err

def test_audio_validator_oversized_file():
    # Simulate exceeding max size
    fake_audio = b"RIFF" + b"\x00" * 4 + b"WAVE" + b"\x00" * (12 * 1024 * 1024)
    is_valid, err = AudioValidator.validate(fake_audio, "huge.wav", "audio/wav")
    assert is_valid is False
    assert "exceeds maximum allowed size" in err

def test_audio_validator_unsupported_extension():
    wav_bytes = generate_mock_wav_bytes(duration_seconds=1.0)
    is_valid, err = AudioValidator.validate(wav_bytes, "test.exe", "audio/wav")
    assert is_valid is False
    assert "Unsupported audio file extension" in err

# ==============================================================================
# Unit Tests: Mock STT and TTS Providers
# ==============================================================================
@pytest.mark.asyncio
async def test_mock_stt_provider():
    provider = MockSTTProvider()
    resp = await provider.transcribe(b"RIFF....WAVE" + b"\x00"*2000, "audio.wav", "audio/wav")
    assert resp.text
    assert resp.confidence > 0.9
    assert resp.provider == "mock"

@pytest.mark.asyncio
async def test_mock_tts_provider():
    provider = MockTTSProvider()
    resp = await provider.synthesize("Perform your action with a steadfast mind.", voice="onyx")
    assert resp.audio_bytes
    assert resp.content_type == "audio/wav"
    assert verify_audio_magic_bytes(resp.audio_bytes) is True
    assert resp.duration_seconds > 0

# ==============================================================================
# Unit Tests: AudioCacheManager
# ==============================================================================
def test_audio_cache_manager():
    cache = AudioCacheManager(cache_dir="/tmp/test_gitamitra_cache")
    uid = str(uuid.uuid4())
    text = "Focus on the present moment with equanimity."
    
    # 1. Cache miss
    assert cache.get(uid, text, voice="onyx", language="en", speed=1.0) is None

    # 2. Set cache
    fake_audio = generate_mock_wav_bytes(0.5)
    cache.set(uid, text, voice="onyx", language="en", speed=1.0, audio_bytes=fake_audio, content_type="audio/wav", duration_seconds=1.5)

    # 3. Cache hit
    hit = cache.get(uid, text, voice="onyx", language="en", speed=1.0)
    assert hit is not None
    audio_data, mime, dur = hit
    assert audio_data == fake_audio
    assert mime == "audio/wav"
    assert dur == 1.5

    # 4. Different user -> Cache miss (User Isolation)
    other_uid = str(uuid.uuid4())
    assert cache.get(other_uid, text, voice="onyx", language="en", speed=1.0) is None

# ==============================================================================
# Integration Tests: Voice API Endpoints & Auth Guards
# ==============================================================================
@pytest.fixture(autouse=True)
def use_mock_voice_providers(monkeypatch):
    """Ensure automated tests use deterministic Mock providers without external API dependency."""
    monkeypatch.setattr("app.core.config.settings.STT_PROVIDER", "mock")
    monkeypatch.setattr("app.core.config.settings.TTS_PROVIDER", "mock")
    monkeypatch.setattr("app.core.config.settings.LLM_PROVIDER", "mock")

@pytest.mark.asyncio
async def test_voice_transcribe_unauthenticated_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        wav_data = generate_mock_wav_bytes(0.5)
        res = await client.post(
            "/api/voice/transcribe",
            files={"file": ("speech.wav", wav_data, "audio/wav")}
        )
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_voice_transcribe_authenticated_success():
    uid = uuid.uuid4().hex[:8]
    user = {"name": "Voice Seeker", "email": f"voice_{uid}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})

        wav_data = generate_mock_wav_bytes(1.0)
        res = await client.post(
            "/api/voice/transcribe",
            files={"file": ("speech.wav", wav_data, "audio/wav")},
            data={"language": "en"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "text" in data
        assert len(data["text"]) > 5
        assert data["confidence"] >= 0.8
        assert data["language"] == "en"

@pytest.mark.asyncio
async def test_voice_synthesize_endpoint():
    uid = uuid.uuid4().hex[:8]
    user = {"name": "Audio Seeker", "email": f"audio_{uid}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})

        payload = {
            "text": "### Wisdom\nPerform your duty without anxiety for the fruits. (BG 2.47)",
            "voice": "onyx",
            "speed": 1.0
        }
        res = await client.post("/api/voice/synthesize", json=payload)
        assert res.status_code == 200
        assert "audio/" in res.headers["content-type"]
        assert len(res.content) > 100

@pytest.mark.asyncio
async def test_voice_settings_get_and_update():
    uid = uuid.uuid4().hex[:8]
    user = {"name": "Settings Seeker", "email": f"vset_{uid}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})

        # 1. Get initial voice settings
        get_res = await client.get("/api/voice/settings")
        assert get_res.status_code == 200
        data = get_res.json()
        assert "voice_enabled" in data
        assert "auto_play" in data
        assert len(data["available_voices"]) >= 3

        # 2. Update voice settings
        update_res = await client.put(
            "/api/voice/settings",
            json={"voice_enabled": True, "auto_play": True, "voice": "echo", "speed": 0.85}
        )
        assert update_res.status_code == 200
        updated = update_res.json()["settings"]
        assert updated["auto_play"] is True
        assert updated["voice"] == "echo"
        assert updated["speed"] == 0.85

# ==============================================================================
# Integration Test: Voice Chat Flow + Safety Priority
# ==============================================================================
@pytest.mark.asyncio
async def test_voice_chat_integration_flow():
    uid = uuid.uuid4().hex[:8]
    user = {"name": "Voice Chat Seeker", "email": f"vchat_{uid}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})

        # Send voice recording to /api/voice/chat
        wav_data = generate_mock_wav_bytes(1.0)
        res = await client.post(
            "/api/voice/chat",
            files={"file": ("inquiry.wav", wav_data, "audio/wav")}
        )
        assert res.status_code == 200
        data = res.json()
        assert "transcribed_text" in data
        assert "response" in data
        assert "conversation_id" in data
        assert "assistant_message_id" in data
        assert len(data["response"]) > 20

        # Verify saved in conversation history
        conv_res = await client.get(f"/api/conversations/{data['conversation_id']}")
        assert conv_res.status_code == 200
        msgs = conv_res.json()["messages"]
        assert len(msgs) >= 2

@pytest.mark.asyncio
async def test_voice_safety_crisis_trigger():
    """Verify high-risk/crisis voice speech triggers emergency safety response."""
    uid = uuid.uuid4().hex[:8]
    user = {"name": "Crisis Seeker", "email": f"crisis_{uid}@test.com", "password": "Password123!"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/auth/register", json=user)
        await client.post("/api/auth/login", json={"email": user["email"], "password": user["password"]})

        # Voice audio with CRISIS_TEST_MARKER
        crisis_wav = generate_mock_wav_bytes(1.0) + b"CRISIS_TEST_MARKER"
        res = await client.post(
            "/api/voice/chat",
            files={"file": ("crisis.wav", crisis_wav, "audio/wav")}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["strategy"] == "CRISIS"
        # Emergency helpline must be present in response
        assert "Tele-MANAS" in data["response"] or "14416" in data["response"] or "helpline" in data["response"].lower()
