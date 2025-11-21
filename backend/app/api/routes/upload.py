from fastapi import APIRouter, UploadFile, File, HTTPException
from app.api.dependencies import save_upload_file, get_media_type
from typing import Dict

router = APIRouter()


@router.post("")
async def upload_file(file: UploadFile = File(...)) -> Dict:
    """
    Загрузка медиа-файла
    
    Поддерживаемые форматы:
    - Изображения: .jpg, .jpeg, .png
    - Аудио: .mp3, .wav, .m4a
    - Видео: .mp4, .webm, .avi
    """
    try:
        file_path = await save_upload_file(file)
        media_type = get_media_type(file.filename)
        
        return {
            "success": True,
            "file_path": file_path,
            "filename": file.filename,
            "media_type": media_type,
            "message": "Файл успешно загружен"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

