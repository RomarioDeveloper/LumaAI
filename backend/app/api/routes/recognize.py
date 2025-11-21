from fastapi import APIRouter, UploadFile, File, HTTPException
from app.api.dependencies import save_upload_file, get_media_type
from app.services.whisper_service import whisper_service
from app.services.ocr_service import ocr_service
from app.core.models import RecognitionResponse, MediaType
import os

try:
    from moviepy.editor import VideoFileClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    VideoFileClip = None

router = APIRouter()


@router.post("", response_model=RecognitionResponse)
async def recognize_media(
    file: UploadFile = File(...),
    enable_diarization: bool = Form(False)
) -> RecognitionResponse:
    """
    Распознавание текста/речи из медиа-файла
    
    Поддерживает:
    - Изображения: OCR распознавание текста
    - Аудио: Распознавание речи через Whisper
    - Видео: Извлечение аудио и распознавание речи
    
    Параметры:
    - enable_diarization: Включить распознавание спикеров (кто что говорит) для аудио/видео
    """
    try:
        
        file_path = await save_upload_file(file)
        media_type = get_media_type(file.filename)
        
        result = None
        
        if media_type == "image":
            
            result = ocr_service.recognize(file_path, return_boxes=True)
            
        elif media_type == "audio":
            
            result = whisper_service.transcribe(
                file_path, 
                return_timestamps=True,
                enable_diarization=enable_diarization
            )
            
        elif media_type == "video":
            
            if not MOVIEPY_AVAILABLE:
                raise HTTPException(status_code=500, detail="MoviePy не установлен. Установите: pip install moviepy")
            audio_path = file_path.replace(os.path.splitext(file_path)[1], ".wav")
            try:
                video = VideoFileClip(file_path)
                if video.audio is not None:
                    video.audio.write_audiofile(audio_path, verbose=False, logger=None)
                    video.close()
                    
                    result = whisper_service.transcribe(
                        audio_path, 
                        return_timestamps=True,
                        enable_diarization=enable_diarization
                    )
                    
                    if os.path.exists(audio_path):
                        os.remove(audio_path)
                else:
                    video.close()
                    raise HTTPException(status_code=400, detail="Видео не содержит аудио дорожку")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Ошибка обработки видео: {str(e)}")
        
        if not result:
            raise HTTPException(status_code=400, detail="Не удалось распознать текст")
        
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return RecognitionResponse(
            text=result.get("text", ""),
            language=result.get("language"),
            confidence=result.get("confidence"),
            segments=result.get("segments"),
            bounding_boxes=result.get("bounding_boxes"),
            speakers=result.get("speakers")
        )(
            text=result.get("text", ""),
            language=result.get("language"),
            confidence=result.get("confidence"),
            segments=result.get("segments"),
            bounding_boxes=result.get("bounding_boxes")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

