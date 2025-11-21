from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from app.services.tts_service import tts_service
import os

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    voice: Optional[str] = None


class TTSResponse(BaseModel):
    audio_url: str
    language: str
    voice: str
    duration_seconds: float
    file_size_bytes: int
    success: bool


@router.post("/synthesize", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest) -> TTSResponse:
    """
    Генерация аудио из текста (Text to Speech)
    
    Поддерживаемые языки:
    - ru: Русский 🇷🇺
    - en: English 🇬🇧
    - de: Deutsch 🇩🇪
    - fr: Français 🇫🇷
    - es: Español 🇪🇸
    - it: Italiano 🇮🇹
    - pt: Português 🇵🇹
    - tr: Türkçe 🇹🇷
    - kk: Қазақша 🇰🇿 (использует английскую модель)
    - zh: 中文 🇨🇳 (использует английскую модель)
    - ar: العربية 🇸🇦 (использует английскую модель)
    """
    try:
        result = tts_service.synthesize(
            text=request.text,
            language=request.language,
            voice=request.voice
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Ошибка генерации аудио")
            )
        
        
        audio_path = result["audio_path"]
        
        audio_url = "/" + audio_path.replace("\\", "/")
        
        return TTSResponse(
            audio_url=audio_url,
            language=result["language"],
            voice=result["voice"],
            duration_seconds=result["duration_seconds"],
            file_size_bytes=result["file_size_bytes"],
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка синтеза речи: {str(e)}"
        )


@router.get("/voices/{language}")
async def get_available_voices(language: str):
    """
    Получить список доступных голосов для языка
    """
    try:
        voices = tts_service.get_available_voices(language)
        return {
            "language": language,
            "voices": voices
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения голосов: {str(e)}"
        )


@router.get("/languages")
async def get_supported_languages():
    """
    Получить список поддерживаемых языков для TTS
    """
    return {
        "languages": [
            {"code": "ru", "name": "Русский", "flag": "🇷🇺"},
            {"code": "en", "name": "English", "flag": "🇬🇧"},
            {"code": "de", "name": "Deutsch", "flag": "🇩🇪"},
            {"code": "fr", "name": "Français", "flag": "🇫🇷"},
            {"code": "es", "name": "Español", "flag": "🇪🇸"},
            {"code": "it", "name": "Italiano", "flag": "🇮🇹"},
            {"code": "pt", "name": "Português", "flag": "🇵🇹"},
            {"code": "tr", "name": "Türkçe", "flag": "🇹🇷"},
            {"code": "kk", "name": "Қазақша", "flag": "🇰🇿"},
            {"code": "zh", "name": "中文", "flag": "🇨🇳"},
            {"code": "ar", "name": "العربية", "flag": "🇸🇦"},
        ]
    }
