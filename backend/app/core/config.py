from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AI-Translate"
    VERSION: str = "1.0.0"
    
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3002",  
        "http://localhost:8000",
        "https://web.telegram.org",
    ]
    
    
    UPLOAD_DIR: str = "uploads"
    MODELS_DIR: str = "models"
    
    
    ALLOWED_IMAGE_FORMATS: List[str] = [".jpg", ".jpeg", ".png"]
    ALLOWED_AUDIO_FORMATS: List[str] = [".mp3", ".wav", ".m4a"]
    ALLOWED_VIDEO_FORMATS: List[str] = [".mp4", ".webm", ".avi"]
    
    
    MAX_FILE_SIZE: int = 100 * 1024 * 1024
    
    
    SUPPORTED_LANGUAGES: dict = {
        "ru": "Русский",
        "kk": "Қазақша",
        "en": "English",
        "de": "Deutsch",  
        "fr": "Français",
        "es": "Español",
        "zh": "中文",
    }
    
    
    WHISPER_MODEL: str = "tiny"  
    
    
    NLLB_MODEL: str = "facebook/nllb-200-distilled-600M"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

