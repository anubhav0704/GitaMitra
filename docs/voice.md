# GitaMitra Voice Interaction System (Step 8)

## 1. Overview & Architecture

The GitaMitra Voice Interaction System introduces a spiritual voice dialogue capability while strictly preserving all existing conversational intelligence, multi-user isolation, long-term memory, hybrid RAG grounding, response validation, and safety systems.

```
Seeker speaks into microphone
           ↓
Browser audio capture (MediaRecorder: WebM/Opus or WAV)
           ↓
POST /api/voice/transcribe
           ↓
Speech-to-Text Provider (Groq Whisper / OpenAI Whisper / Mock)
           ↓
Normalized Transcribed User Message
           ↓
Existing Chat Pipeline (ChatService)
  ├── 1. Safety & Crisis Detection (Pre-turn evaluation)
  ├── 2. User-Isolated Memory Retrieval
  ├── 3. Emotion & Concept Graph Analysis
  ├── 4. Hybrid Gita RAG Retrieval (700 Verses)
  ├── 5. Response Strategy Selection & Prompt Construction
  ├── 6. LLM Generation
  └── 7. Response Validation (Prevents hallucinations & deific claims)
           ↓
Streaming Text Response to Seeker
           ↓
POST /api/voice/synthesize
           ↓
SpeechTextFormatter (Strips Markdown, preserves Sanskrit & Hindi)
           ↓
Deterministic Audio Cache (SHA-256 Content Hash)
           ↓
Text-to-Speech Provider (OpenAI TTS / ElevenLabs / Mock)
           ↓
Frontend Audio Player with "Stop Speaking" Interruption & Replay
```

---

## 2. Provider Abstractions

The voice system adheres to clean provider abstractions so vendors are never hardcoded throughout the service layer:

### Speech-to-Text (`STTProvider`)
- **`WhisperSTTProvider` (Groq & OpenAI):**
  Uses OpenAI-compatible multipart audio transcriptions API (`/v1/audio/transcriptions`).
  - Models: `whisper-large-v3` (default on Groq, near real-time latency), `whisper-1` (OpenAI).
  - Languages: Hindi (`hi`), English (`en`), and Hinglish (natural mixed script).
- **`MockSTTProvider`:**
  Deterministic in-memory transcription for automated tests and offline development without external API dependencies.

### Text-to-Speech (`TTSProvider`)
- **`OpenAITTSProvider`:**
  Connects to OpenAI Audio Speech API (`/v1/audio/speech`).
  - Models: `tts-1`, `tts-1-hd`.
  - Persona Voices: `onyx` (deep, calm, grounded spiritual tone), `alloy`, `echo`, `fable`, `nova`, `shimmer`.
- **`ElevenLabsTTSProvider`:**
  Multilingual neural voice synthesis for calm spiritual companion voices.
- **`MockTTSProvider`:**
  Generates real PCM 16-bit WAV audio files (432Hz meditative bell envelope) for testing and offline development.

---

## 3. Configuration & Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VOICE_ENABLED` | `true` | Master switch for voice interaction |
| `STT_PROVIDER` | `groq` | Options: `groq`, `openai`, `mock` |
| `STT_MODEL` | `whisper-large-v3` | STT model identifier |
| `STT_API_KEY` | (Uses `GROQ_API_KEY`) | API key for STT |
| `TTS_PROVIDER` | `mock` | Options: `openai`, `elevenlabs`, `edge`, `mock` |
| `TTS_MODEL` | `tts-1` | TTS model identifier |
| `TTS_API_KEY` | (Uses `OPENAI_API_KEY`) | API key for TTS |
| `TTS_VOICE` | `onyx` | Default voice persona |
| `VOICE_LANGUAGE` | `auto` | Preferred language hint (`auto`, `en`, `hi`) |
| `VOICE_MAX_DURATION_SECONDS` | `60` | Maximum recording duration |
| `VOICE_MAX_FILE_SIZE_MB` | `10` | Maximum uploaded audio file size |
| `VOICE_CACHE_ENABLED` | `true` | Enables deterministic audio caching |

---

## 4. Audio Validation & Security

1. **Size Limits:** Enforces a maximum file size of 10MB (configurable) and rejects uploads below 32 bytes.
2. **Format Verification:** Validates extensions (`.webm`, `.wav`, `.mp3`, `.ogg`, `.m4a`).
3. **Magic Byte Inspection:** Inspects binary headers server-side (`RIFF....WAVE`, `OggS`, `\x1a\x45\xdf\xa3` WebM, `ID3` MP3, `ftyp` MP4/M4A) rather than blindly trusting the client `Content-Type`.
4. **Authentication:** All voice endpoints require an authenticated user JWT cookie/token.
5. **Multi-User Isolation:** Audio caches and voice telemetry sessions are strictly isolated per `user_id`.

---

## 5. Temporary Audio Storage & Privacy

- Audio recordings are processed in memory and deleted immediately after transcription.
- **Zero Raw Audio Storage:** GitaMitra never permanently stores seeker voice recordings by default.
- **Telemetry Only:** The `voice_sessions` database table logs non-sensitive metadata only (duration in ms, detected language, provider, timestamps). No audio or credentials are ever stored.

---

## 6. Sanskrit Pronunciation & SpeechTextFormatter

`SpeechTextFormatter` prepares AI responses specifically for natural spoken delivery:
- **Markdown Stripping:** Removes headings (`###`), bold markers (`**`), bullet points, and links without affecting wording.
- **Citation Sanitization:** Removes parenthetical and bracketed references (e.g. `(BG 2.47)`, `[Chapter 2, Verse 47]`) so the synthesized voice does not awkwardly read database markers.
- **Authentic Scripture Preservation:** Preserves authentic Sanskrit Devanagari verses (e.g. `कर्मण्येवाधिकारस्ते मा फलेषु कदाचन`) and Hindi text intact.
- **Spiritual Persona:** Phrasing is adjusted with natural pauses for a calm, respectful, unhurried presence.

---

## 7. Voice API Endpoints

### 1. `POST /api/voice/transcribe`
- **Input:** `multipart/form-data` with `file`, optional `language`, optional `conversation_id`.
- **Output:**
  ```json
  {
    "text": "Mujhe apne career ko lekar bahut tension ho rahi hai.",
    "language": "hi",
    "duration_seconds": 3.8,
    "confidence": 0.96,
    "provider": "groq",
    "model": "whisper-large-v3"
  }
  ```

### 2. `POST /api/voice/synthesize`
- **Input:** `{"text": "...", "language": "en", "voice": "onyx", "speed": 1.0}`
- **Output:** Audio binary stream (`audio/mpeg` or `audio/wav`) with `Cache-Control` headers.

### 3. `POST /api/voice/chat`
- **Input:** `multipart/form-data` audio file.
- **Output:** Unified response containing transcribed text, GitaMitra reasoning response, verified Gita references, emotion analysis, and conversation metadata.

### 4. `GET /api/voice/settings` & `PUT /api/voice/settings`
- User voice preferences: voice mode, auto-play, preferred language, voice persona, and speed.

---

## 8. Safety & Crisis Prioritization

Safety detection executes on the **transcribed text immediately before response generation**:
- If self-harm, suicide, or crisis markers are detected by `EmotionContextService.analyze(transcribed_text)`, the Step 7 `CRISIS` strategy takes absolute priority.
- GitaMitra responds with compassionate, immediate support and verified crisis helpline details (e.g. Tele-MANAS 14416) rather than a generic spiritual treatise.

---

## 9. Browser Audio Recording & Fallback Behavior

- Uses browser `MediaRecorder` with progressive codec detection:
  1. `audio/webm;codecs=opus`
  2. `audio/webm`
  3. `audio/mp4`
  4. `audio/wav`
- Gracefully handles microphone permission denial or missing audio hardware.
- Autoplay policy restrictions are respected: if the browser blocks automatic audio playback, the interface cleanly displays `"Tap play to listen"`.
