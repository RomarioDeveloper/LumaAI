from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.api.dependencies import save_upload_file, get_media_type
from app.core.models import ProcessMediaRequest, ProcessMediaResponse, MediaType
from app.services.media_processor import media_processor
from typing import List, Optional
import asyncio
import time
import os

router = APIRouter()


@router.post("", response_model=ProcessMediaResponse)
async def process_media(
    file: UploadFile = File(...),
    target_languages: str = Form("ru,kk,en"),  
    generate_tts: bool = Form(False),
    replace_text_on_image: bool = Form(False),
    enable_diarization: bool = Form(False)  
) -> ProcessMediaResponse:
    """
    Полная обработка медиа-файла: распознавание + перевод + опционально TTS и замена текста
    
    Параметры:
    - file: Медиа-файл для обработки
    - target_languages: Языки для перевода (через запятую, например: "ru,kk,en")
    - generate_tts: Генерировать ли аудио из переведенного текста (бонус)
    - replace_text_on_image: Заменить ли текст на изображении (только для изображений, бонус)
    - enable_diarization: Включить распознавание спикеров (кто что говорит) для аудио/видео
    """
    start_time = time.time()
    try:
        file_path = await save_upload_file(file)
        media_type_str = get_media_type(file.filename)
        media_type = MediaType(media_type_str)
        languages_list = [lang.strip() for lang in target_languages.split(",")]
        
        
        request = ProcessMediaRequest(
            media_type=media_type,
            target_languages=languages_list,
            generate_tts=generate_tts,
            replace_text_on_image=replace_text_on_image,
            enable_diarization=enable_diarization
        )
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: media_processor.process_media(request, file_path)
        )
        return result
        
    except HTTPException:
        
        raise
    except ValueError as e:
        
        raise HTTPException(status_code=400, detail=f"Ошибка валидации: {str(e)}")
    except ImportError as e:
        
        error_msg = str(e)
        if "Whisper" in error_msg or "whisper" in error_msg:
            detail_msg = "Для обработки аудио/видео необходимо установить Whisper. Выполните: pip install openai-whisper"
        elif "EasyOCR" in error_msg or "easyocr" in error_msg or "OCR" in error_msg:
            detail_msg = "Для обработки изображений необходимо установить EasyOCR. Выполните: pip install easyocr"
        elif "transformers" in error_msg or "NLLB" in error_msg:
            detail_msg = "Для перевода необходимо установить transformers. Выполните: pip install transformers"
        else:
            detail_msg = f"AI-модель не установлена: {error_msg}. Установите необходимые зависимости."
        raise HTTPException(status_code=503, detail=detail_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки файла: {str(e)}")

