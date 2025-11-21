import os
import time
from typing import Dict, Any

try:
    from moviepy.editor import VideoFileClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    VideoFileClip = None
from app.core.models import (
    MediaType, 
    ProcessMediaRequest, 
    ProcessMediaResponse,
    RecognitionResponse,
    TranslationResponse,
    TTSResponse
)
from app.services.whisper_service import whisper_service
from app.services.ocr_service import ocr_service
from app.services.translation_service import translation_service
from app.services.tts_service import tts_service
from app.core.config import settings


class MediaProcessor:
    """Основной сервис для обработки медиа-файлов"""
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def extract_audio_from_video(self, video_path: str, output_audio_path: str) -> str:
        """Извлечение аудио из видео файла"""
        if not MOVIEPY_AVAILABLE:
            raise ImportError("MoviePy не установлен. Установите: pip install moviepy")
        try:
            video = VideoFileClip(video_path)
            if video.audio is not None:
                
                max_duration = 90  
                audio_duration = min(video.duration, max_duration)
                
                if video.duration > max_duration:
                    video_clip = video.subclip(0, max_duration)
                    video_clip.audio.write_audiofile(output_audio_path, verbose=False, logger=None)
                    video_clip.close()
                else:
                    video.audio.write_audiofile(output_audio_path, verbose=False, logger=None)
                
                video.close()
                return output_audio_path
            else:
                video.close()
                raise ValueError("Видео не содержит аудио дорожку")
        except Exception as e:
            raise ValueError(f"Ошибка извлечения аудио: {e}")
    
    def process_media(self, request: ProcessMediaRequest, file_path: str) -> ProcessMediaResponse:
        """
        Полная обработка медиа-файла: распознавание + перевод + опционально TTS
        
        Args:
            request: Запрос на обработку
            file_path: Путь к файлу
            
        Returns:
            Результат обработки
        """
        
        recognition_result = None
        
        try:
            if request.media_type == MediaType.IMAGE:
                
                recognition_result = ocr_service.recognize(file_path, return_boxes=False)
                
            elif request.media_type == MediaType.AUDIO:
                
                recognition_result = whisper_service.transcribe(
                    file_path, 
                    return_timestamps=False,
                    enable_diarization=request.enable_diarization
                )
                
            elif request.media_type == MediaType.VIDEO:
                
                audio_path = os.path.join(self.upload_dir, f"temp_audio_{os.path.basename(file_path)}.wav")
                self.extract_audio_from_video(file_path, audio_path)
                
                recognition_result = whisper_service.transcribe(
                    audio_path, 
                    return_timestamps=False,
                    enable_diarization=request.enable_diarization
                )
                
                if os.path.exists(audio_path):
                    os.remove(audio_path)
        except ImportError as e:
            raise ImportError(f"AI-модель не установлена: {str(e)}. Для обработки {request.media_type.value} установите необходимые зависимости.")
        except Exception as e:
            raise ValueError(f"Ошибка распознавания {request.media_type.value}: {str(e)}")
        
        if not recognition_result or not recognition_result.get("text"):
            raise ValueError("Не удалось распознать текст из медиа-файла. Возможно, файл не содержит текста или речи.")
        
        recognized_text = recognition_result.get("text", "")
        
        skip_translation = False
        
        if len(recognized_text) > 3000:
            skip_translation = True
        
        if skip_translation:
            translations = {}
            for lang in request.target_languages:
                translations[lang] = recognized_text
            translation_result = {
                "original_text": recognized_text,
                "source_language": recognition_result.get("language") or "auto",
                "translations": translations
            }
            
            return ProcessMediaResponse(
                recognition=RecognitionResponse(
                    text=recognition_result["text"],
                    language=recognition_result.get("language"),
                    confidence=recognition_result.get("confidence"),
                    segments=recognition_result.get("segments"),
                    bounding_boxes=recognition_result.get("bounding_boxes")
                ),
                translation=TranslationResponse(**translation_result),
                tts=None,
                processed_image_path=None
            )
        
        source_language = recognition_result.get("language")
        
        if source_language:
            source_language = source_language.lower().strip()
            
            whisper_to_our_codes = {
                "russian": "ru",
                "kazakh": "kk", 
                "english": "en",
                "german": "de",
                "french": "fr",
                "spanish": "es",
                "chinese": "zh",
            }
            source_language = whisper_to_our_codes.get(source_language, source_language)
        translations = translation_service.translate_multiple(
            recognized_text,
            source_language=source_language,
            target_languages=request.target_languages
        )
        
        translation_result = {
            "original_text": recognition_result["text"],
            "source_language": source_language or "auto",
            "translations": translations
        }
        
        
        processed_image_path = None
        if request.replace_text_on_image and request.media_type == MediaType.IMAGE:
            import uuid
            file_ext = os.path.splitext(file_path)[1]
            output_filename = f"processed_{uuid.uuid4().hex[:8]}{file_ext}"
            output_image_path = os.path.join(self.upload_dir, output_filename)
            ocr_service.replace_text_on_image(file_path, translations, output_image_path)
            processed_image_path = output_filename  
        
        
        tts_result = None
        if request.generate_tts:
            
            target_lang = request.target_languages[0] if request.target_languages else "ru"
            translated_text = translations.get(target_lang, recognition_result["text"])
            
            import uuid
            tts_filename = f"tts_{uuid.uuid4().hex[:8]}.wav"
            tts_output_path = os.path.join(self.upload_dir, tts_filename)
            
            tts_result = tts_service.generate_speech(
                translated_text,
                language=target_lang,
                output_path=tts_output_path
            )
            
            tts_result["audio_path"] = tts_filename
        
        
        return ProcessMediaResponse(
            recognition=RecognitionResponse(
                text=recognition_result["text"],
                language=recognition_result.get("language"),
                confidence=recognition_result.get("confidence"),
                segments=recognition_result.get("segments"),
                bounding_boxes=recognition_result.get("bounding_boxes"),
                speakers=recognition_result.get("speakers")
            ),
            translation=TranslationResponse(**translation_result),
            tts=TTSResponse(**tts_result) if tts_result else None,
            processed_image_path=processed_image_path
        )


media_processor = MediaProcessor()

