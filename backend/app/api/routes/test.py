from fastapi import APIRouter, UploadFile, File, HTTPException
from app.api.dependencies import save_upload_file, get_media_type
from typing import Dict
import os

router = APIRouter()


@router.post("/upload")
async def test_upload(file: UploadFile = File(...)) -> Dict:
    """
    Тестовый endpoint для проверки загрузки файлов без обработки
    """
    try:
        
        file_path = await save_upload_file(file)
        
        
        media_type = get_media_type(file.filename)
        
        
        file_exists = os.path.exists(file_path)
        file_size = os.path.getsize(file_path) if file_exists else 0
        
        return {
            "success": True,
            "message": "Файл успешно загружен (тест без обработки)",
            "file_path": file_path,
            "filename": file.filename,
            "media_type": media_type,
            "file_exists": file_exists,
            "file_size": file_size,
            "note": "Это тестовый endpoint. Для полной обработки используйте /api/process"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

