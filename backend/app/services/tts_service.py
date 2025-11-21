from typing import Optional, Dict
import os
from app.core.config import settings

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    gTTS = None

try:
    from TTS.api import TTS
    import torch
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    TTS = None
    torch = None


class TTSService:
    """Сервис для синтеза речи (Text to Speech)"""
    
    def __init__(self):
        self.tts_model = None
        self.current_model = None
        
        self.language_models = {
            "en": "tts_models/en/ljspeech/tacotron2-DDC",  
            "ru": "tts_models/ru/ruslan/tacotron2-DDC",   
            "de": "tts_models/de/thorsten/tacotron2-DDC", 
            "fr": "tts_models/fr/mai/tacotron2-DDC",      
            "es": "tts_models/es/mai/tacotron2-DDC",      
            "it": "tts_models/it/mai/tacotron2-DDC",      
            "pt": "tts_models/pt/cv/vits",                
            "tr": "tts_models/tr/common-voice/glow-tts",
            "kk": "tts_models/en/ljspeech/tacotron2-DDC",
            "zh": "tts_models/en/ljspeech/tacotron2-DDC",
            "ar": "tts_models/en/ljspeech/tacotron2-DDC",
        }
        
        self.available_voices = {
            "en": ["female_1", "female_2", "male_1"],
            "ru": ["female", "male"],
            "de": ["female", "male"],
            "fr": ["female"],
            "es": ["female"],
            "it": ["female"],
            "pt": ["female"],
            "tr": ["female"],
        }
    
    def load_model(self, language: str = "en") -> Optional[TTS]:
        """
        Загрузка модели TTS для указанного языка
        """
        if not TTS_AVAILABLE:
            raise ImportError("TTS не установлен. Установите: pip install TTS")
        
        model_name = self.language_models.get(language, self.language_models["en"])
        
        if self.tts_model is not None and self.current_model == model_name:
            return self.tts_model
        
        try:
            use_gpu = torch.cuda.is_available() if torch else False
            self.tts_model = TTS(model_name, progress_bar=False, gpu=use_gpu)
            self.current_model = model_name
            return self.tts_model
        except Exception:
            try:
                fallback_model = "tts_models/en/ljspeech/tacotron2-DDC"
                self.tts_model = TTS(fallback_model, progress_bar=False, gpu=False)
                self.current_model = fallback_model
                return self.tts_model
            except Exception:
                return None
    
    def synthesize(
        self,
        text: str,
        language: str = "en",
        output_path: Optional[str] = None,
        voice: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Синтез речи из текста
        
        Args:
            text: Текст для синтеза
            language: Язык текста
            output_path: Путь для сохранения аудио (если None, генерируется автоматически)
            voice: Выбор голоса (опционально)
        
        Returns:
            Словарь с путём к аудиофайлу и метаданными
        """
        import time
        start_time = time.time()
        
        if len(text) > 500:
            text = text[:500]
        
        if output_path is None:
            os.makedirs("uploads/tts", exist_ok=True)
            timestamp = int(time.time() * 1000)
            output_path = f"uploads/tts/speech_{language}_{timestamp}.mp3"
        
        if GTTS_AVAILABLE:
            try:
                synthesis_start = time.time()
                
                lang_map = {
                    "ru": "ru", "en": "en", "de": "de", "fr": "fr",
                    "es": "es", "it": "it", "pt": "pt", "tr": "tr",
                    "kk": "ru", "zh": "zh-CN", "ar": "ar"
                }
                tts_lang = lang_map.get(language, "en")
                
                is_slow = voice == "slow"
                
                tts = gTTS(text=text, lang=tts_lang, slow=is_slow)
                tts.save(output_path)
                
                synthesis_time = time.time() - synthesis_start
                total_time = time.time() - start_time
                
                file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                
                return {
                    "audio_path": output_path,
                    "language": language,
                    "voice": f"google_{voice if voice else 'default'}",
                    "duration_seconds": synthesis_time,
                    "file_size_bytes": file_size,
                    "text_length": len(text),
                    "success": True
                }
            except Exception:
                pass
        
        if not TTS_AVAILABLE:
            raise ValueError("TTS недоступен")
        
        tts = self.load_model(language)
        if tts is None:
            raise ValueError("Не удалось загрузить TTS модель")
        
        output_path = output_path.replace('.mp3', '.wav')
        
        try:
            synthesis_start = time.time()
            
            if voice and hasattr(tts, 'speakers'):
                tts.tts_to_file(
                    text=text,
                    file_path=output_path,
                    speaker=voice
                )
            else:
                tts.tts_to_file(
                    text=text,
                    file_path=output_path
                )
            
            synthesis_time = time.time() - synthesis_start
            total_time = time.time() - start_time
            
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            return {
                "audio_path": output_path,
                "language": language,
                "voice": voice or "default",
                "duration_seconds": synthesis_time,
                "file_size_bytes": file_size,
                "text_length": len(text),
                "success": True
            }
            
        except Exception as e:
            return {
                "audio_path": None,
                "error": str(e),
                "success": False
            }
    
    def get_available_voices(self, language: str) -> list:
        """
        Получить список доступных голосов для языка
        """
        return self.available_voices.get(language, ["default"])


tts_service = TTSService()
