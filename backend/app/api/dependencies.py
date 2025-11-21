from fastapi import UploadFile, HTTPException
from app.core.config import settings
import os
import aiofiles
from typing import Optional


async def save_upload_file(upload_file: UploadFile, upload_dir: str = None) -> str:
    """
    Сохранение загруженного файла
    
    Args:
        upload_file: Загруженный файл
        upload_dir: Директория для сохранения
        
    Returns:
        Путь к сохраненному файлу
    """
    if upload_dir is None:
        upload_dir = settings.UPLOAD_DIR
    
    os.makedirs(upload_dir, exist_ok=True)
    
    
    contents = await upload_file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Файл слишком большой")
    
    
    file_extension = os.path.splitext(upload_file.filename)[1].lower()
    
    
    allowed_formats = (
        settings.ALLOWED_IMAGE_FORMATS +
        settings.ALLOWED_AUDIO_FORMATS +
        settings.ALLOWED_VIDEO_FORMATS
    )
    
    if file_extension not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат файла. Разрешенные форматы: {', '.join(allowed_formats)}"
        )
    
    
    file_path = os.path.join(upload_dir, upload_file.filename)
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    return file_path


def get_media_type(filename: str) -> str:
    """Определение типа медиа-файла по расширению"""
    extension = os.path.splitext(filename)[1].lower()
    
    if extension in settings.ALLOWED_IMAGE_FORMATS:
        return "image"
    elif extension in settings.ALLOWED_AUDIO_FORMATS:
        return "audio"
    elif extension in settings.ALLOWED_VIDEO_FORMATS:
        return "video"
    else:
        raise ValueError(f"Неподдерживаемый формат файла: {extension}")

