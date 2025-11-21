from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class MediaType(str, Enum):
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"


class LanguageCode(str, Enum):
    RU = "ru"
    KK = "kk"
    EN = "en"
    DE = "de"
    FR = "fr"
    ES = "es"
    ZH = "zh"


class RecognitionRequest(BaseModel):
    file_path: str
    media_type: MediaType


class RecognitionResponse(BaseModel):
    text: str
    language: Optional[str] = None
    confidence: Optional[float] = None
    segments: Optional[List[Dict[str, Any]]] = None  
    bounding_boxes: Optional[List[Dict[str, Any]]] = None  
    speakers: Optional[Dict[str, Any]] = None  


class TranslationRequest(BaseModel):
    text: str
    source_language: Optional[str] = None  
    target_languages: List[str] = Field(default=["ru", "kk", "en"])


class TranslationResponse(BaseModel):
    original_text: str
    source_language: str
    translations: Dict[str, str]  


class TTSRequest(BaseModel):
    text: str
    language: str = "ru"
    voice: Optional[str] = None


class TTSResponse(BaseModel):
    audio_path: str
    duration: float


class ProcessMediaRequest(BaseModel):
    media_type: MediaType
    target_languages: List[str] = Field(default=["ru", "kk", "en"])
    generate_tts: bool = False
    replace_text_on_image: bool = False  
    enable_diarization: bool = False  


class ProcessMediaResponse(BaseModel):
    recognition: RecognitionResponse
    translation: TranslationResponse
    tts: Optional[TTSResponse] = None
    processed_image_path: Optional[str] = None  

