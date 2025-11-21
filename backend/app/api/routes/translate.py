from fastapi import APIRouter, HTTPException
from app.core.models import TranslationRequest, TranslationResponse
from app.services.translation_service import translation_service

router = APIRouter()


@router.post("", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest) -> TranslationResponse:
    """
    Перевод текста на указанные языки
    
    Поддерживаемые языки:
    - ru: Русский
    - kk: Қазақша
    - en: English
    - de: Deutsch (бонус)
    - fr: Français (бонус)
    - es: Español (бонус)
    - zh: 中文 (бонус)
    """
    try:
        translations = translation_service.translate_multiple(
            request.text,
            source_language=request.source_language,
            target_languages=request.target_languages
        )
        
        
        source_lang = request.source_language
        if source_lang is None:
            source_lang = translation_service.detect_language(request.text)
        
        return TranslationResponse(
            original_text=request.text,
            source_language=source_lang,
            translations=translations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

