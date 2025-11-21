from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.api.dependencies import save_upload_file, get_media_type
from app.core.models import ProcessMediaRequest, ProcessMediaResponse, MediaType
from app.services.media_processor import media_processor
from typing import List, Optional
import time

router = APIRouter()


@router.post("/fast", response_model=ProcessMediaResponse)
async def process_media_fast(
    file: UploadFile = File(...),
    target_languages: str = Form("ru,kk,en"),
    generate_tts: bool = Form(False),
    replace_text_on_image: bool = Form(False)
) -> ProcessMediaResponse:
    """
    Быстрая обработка медиа-файла с минимальными опциями для максимальной скорости
    
    Оптимизации:
    - Использует только базовое распознавание без детальных меток
    - Упрощенный перевод
    - Минимальная обработка
    """
    start_time = time.time()
    
    try:
        file_path = await save_upload_file(file)
        media_type_str = get_media_type(file.filename)
        media_type = MediaType(media_type_str)
        languages_list = [lang.strip() for lang in target_languages.split(",")]
        
        request = ProcessMediaRequest(
            media_type=media_type,
            target_languages=languages_list[:3],  
            generate_tts=False,  
            replace_text_on_image=False  
        )
        
        result = media_processor.process_media(request, file_path)
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Ошибка валидации: {str(e)}")
    except ImportError as e:
        error_msg = str(e)
        if "Whisper" in error_msg:
            detail_msg = "Для обработки аудио/видео необходимо установить Whisper"
        elif "EasyOCR" in error_msg:
            detail_msg = "Для обработки изображений необходимо установить EasyOCR"
        elif "transformers" in error_msg:
            detail_msg = "Для перевода необходимо установить transformers"
        else:
            detail_msg = f"AI-модель не установлена: {error_msg}"
        raise HTTPException(status_code=503, detail=detail_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки файла: {str(e)}")

