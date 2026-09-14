import logging
from typing import Any, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.config import settings
from app.models.domain import User, UserPreference, VoiceSession
from app.api.deps import get_current_user
from app.voice.service import SpeechToTextService, TextToSpeechService
from app.services.chat import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    language: Optional[str] = Field("en", description="Language code e.g. en, hi")
    voice: Optional[str] = Field(None, description="Voice identifier e.g. onyx, alloy")
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0)
    conversation_id: Optional[UUID] = None
    message_id: Optional[UUID] = None


class VoiceSettingsUpdate(BaseModel):
    voice_enabled: Optional[bool] = None
    auto_play: Optional[bool] = None
    language: Optional[str] = None
    voice: Optional[str] = None
    speed: Optional[float] = Field(None, ge=0.5, le=2.0)


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    conversation_id: Optional[UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Transcribe spoken voice audio into text.
    Validates audio file server-side and enforces privacy (temporary processing only).
    """
    if not getattr(settings, "VOICE_ENABLED", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voice interaction is currently disabled."
        )

    try:
        audio_bytes = await file.read()
        filename = file.filename or "recording.webm"
        content_type = file.content_type or "audio/webm"

        stt_service = SpeechToTextService()
        result = await stt_service.transcribe_audio(
            user=current_user,
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language=language
        )

        # Log session telemetry without storing raw audio
        session = VoiceSession(
            user_id=current_user.id,
            conversation_id=conversation_id,
            input_language=result.language,
            input_duration_ms=int(result.duration_seconds * 1000),
            stt_provider=result.provider,
            voice_metadata={"model": result.model, "confidence": result.confidence}
        )
        db.add(session)
        await db.commit()

        return result.to_dict()

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(e))
    except Exception as e:
        logger.error(f"Voice transcription error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice transcription could not be completed. Please try again."
        )


@router.post("/synthesize")
async def synthesize_speech(
    request: SynthesizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Synthesize text into natural spoken spiritual audio.
    Strips raw markdown/citations and caches user audio for replay efficiency.
    """
    if not getattr(settings, "VOICE_ENABLED", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voice interaction is currently disabled."
        )

    try:
        tts_service = TextToSpeechService()
        result = await tts_service.synthesize_text(
            user=current_user,
            text=request.text,
            voice=request.voice,
            language=request.language,
            speed=request.speed
        )

        return Response(
            content=result.audio_bytes,
            media_type=result.content_type,
            headers={
                "Content-Disposition": "inline; filename=response.mp3",
                "X-Audio-Duration": str(result.duration_seconds),
                "X-Audio-Provider": result.provider,
                "Cache-Control": "private, max-age=86400"
            }
        )

    except TimeoutError as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(e))
    except Exception as e:
        logger.error(f"Speech synthesis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech synthesis could not be completed at this time."
        )


@router.post("/chat")
async def voice_chat(
    file: UploadFile = File(...),
    conversation_id: Optional[UUID] = Form(None),
    language: Optional[str] = Form(None),
    response_depth: Optional[str] = Form("BALANCED"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Unified voice chat endpoint:
    Audio Upload -> STT -> Transcribed text -> existing ChatService (Safety + Memory + RAG + LLM) -> Response
    """
    if not getattr(settings, "VOICE_ENABLED", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voice interaction is currently disabled."
        )

    # 1. Transcribe speech
    try:
        audio_bytes = await file.read()
        stt_service = SpeechToTextService()
        stt_res = await stt_service.transcribe_audio(
            user=current_user,
            audio_bytes=audio_bytes,
            filename=file.filename or "recording.webm",
            content_type=file.content_type or "audio/webm",
            language=language
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Voice chat STT failure: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Speech transcription failed: {str(e)}")

    if not stt_res.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not understand audio. Please speak clearly and try again.")

    # 2. Process message using the exact same ChatService pipeline
    chat_service = ChatService(db)
    try:
        chat_response = await chat_service.send_message_non_streaming(
            user=current_user,
            message_text=stt_res.text,
            conversation_id=conversation_id,
            response_depth=response_depth or "BALANCED"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Chat processing failed in voice pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"GitaMitra reasoning failed: {str(e)}")

    # 3. Log voice session
    session = VoiceSession(
        user_id=current_user.id,
        conversation_id=UUID(chat_response["conversation_id"]),
        message_id=UUID(chat_response["user_message_id"]),
        input_language=stt_res.language,
        input_duration_ms=int(stt_res.duration_seconds * 1000),
        stt_provider=stt_res.provider,
        voice_metadata={"input_mode": "voice", "confidence": stt_res.confidence}
    )
    db.add(session)
    await db.commit()

    return {
        **chat_response,
        "transcribed_text": stt_res.text,
        "input_language": stt_res.language,
        "transcription_confidence": stt_res.confidence
    }


@router.get("/settings")
async def get_voice_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieve user voice preferences."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()
    user_settings = pref.settings if pref else {}
    voice_pref = user_settings.get("voice", {})

    return {
        "voice_enabled": voice_pref.get("voice_enabled", True),
        "auto_play": voice_pref.get("auto_play", False),
        "language": voice_pref.get("language", "auto"),
        "voice": voice_pref.get("voice", settings.TTS_VOICE or "onyx"),
        "speed": voice_pref.get("speed", 1.0),
        "available_voices": [
            {"id": "onyx", "name": "Deep Sanctuary (Calm & Grounded)", "gender": "Neutral"},
            {"id": "alloy", "name": "Peaceful Seeker (Warm & Balanced)", "gender": "Neutral"},
            {"id": "echo", "name": "Meditative Guide (Resonant)", "gender": "Neutral"},
            {"id": "shimmer", "name": "Gentle Light (Clear & Soft)", "gender": "Neutral"}
        ]
    }


@router.put("/settings")
async def update_voice_settings(
    request: VoiceSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update user voice preferences."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = UserPreference(user_id=current_user.id, settings={})
        db.add(pref)

    current_settings = dict(pref.settings or {})
    voice_pref = dict(current_settings.get("voice", {}))

    if request.voice_enabled is not None:
        voice_pref["voice_enabled"] = request.voice_enabled
    if request.auto_play is not None:
        voice_pref["auto_play"] = request.auto_play
    if request.language is not None:
        voice_pref["language"] = request.language
    if request.voice is not None:
        voice_pref["voice"] = request.voice
    if request.speed is not None:
        voice_pref["speed"] = request.speed

    current_settings["voice"] = voice_pref
    pref.settings = current_settings
    await db.commit()

    return {
        "message": "Voice settings updated successfully",
        "settings": voice_pref
    }
