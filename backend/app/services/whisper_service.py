from typing import Dict, List, Any, Optional
import os
from app.core.config import settings
from concurrent.futures import ThreadPoolExecutor, as_completed
import tempfile

try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    WhisperModel = None

try:
    from pyannote.audio import Pipeline
    import torch
    PYANNOTE_AVAILABLE = True
except ImportError:
    PYANNOTE_AVAILABLE = False
    Pipeline = None


class WhisperService:
    """Сервис для распознавания речи из аудио/видео файлов (faster-whisper)"""
    
    def __init__(self):
        self.model = None
        self.model_name = settings.WHISPER_MODEL
        self.diarization_pipeline = None
    
    def load_model(self):
        """Загрузка модели Whisper"""
        if not WHISPER_AVAILABLE:
            raise ImportError("Faster-Whisper не установлен. Установите: pip install faster-whisper")
        if self.model is None:
            self.model = WhisperModel(
                self.model_name,
                device="cpu",
                compute_type="int8",  
                download_root=settings.MODELS_DIR,
                num_workers=4,  
            )
        return self.model
    
    def load_diarization_pipeline(self):
        """Загрузка pipeline для speaker diarization"""
        if not PYANNOTE_AVAILABLE:
            raise ImportError("pyannote.audio не установлен. Установите: pip install pyannote.audio")
        
        if self.diarization_pipeline is None:
            try:
                self.diarization_pipeline = Pipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    use_auth_token=None  
                )
            except Exception:
                self.diarization_pipeline = None
        
        return self.diarization_pipeline
    
    def perform_speaker_diarization(self, audio_path: str) -> Optional[Dict[str, Any]]:
        """
        Выполнение speaker diarization (определение спикеров)
        
        Args:
            audio_path: Путь к аудио файлу
            
        Returns:
            Словарь с информацией о спикерах или None если недоступно
        """
        if not PYANNOTE_AVAILABLE:
            return None
        
        try:
            pipeline = self.load_diarization_pipeline()
            if pipeline is None:
                return None
            
            diarization = pipeline(audio_path)
            
            speakers_info = {
                "num_speakers": len(diarization.labels()),
                "segments": []
            }
            
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                speakers_info["segments"].append({
                    "start": round(turn.start, 2),
                    "end": round(turn.end, 2),
                    "speaker": speaker,
                    "duration": round(turn.end - turn.start, 2)
                })
            
            return speakers_info
            
        except Exception:
            return None
    
    def transcribe(
        self, 
        audio_path: str, 
        language: Optional[str] = None,
        return_timestamps: bool = False,  
        enable_diarization: bool = False  
    ) -> Dict[str, Any]:
        """
        Распознавание речи из аудио файла (faster-whisper)
        Для длинных файлов использует сегментацию и параллельную обработку
        
        Args:
            audio_path: Путь к аудио файлу
            language: Язык аудио (None для автоопределения)
            return_timestamps: Возвращать ли временные метки
            enable_diarization: Включить распознавание спикеров
            
        Returns:
            Словарь с результатами распознавания
        """
        import time
        import os
        
        duration = None
        try:
            import librosa
            
            try:
                duration = librosa.get_duration(path=audio_path)
            except:
                audio_data, sample_rate = librosa.load(audio_path, sr=None, duration=None)
                duration = len(audio_data) / sample_rate
            
            if duration > 30:
                result = self._transcribe_long_audio(audio_path, language, return_timestamps, duration)
            else:
                result = self._transcribe_short_audio(audio_path, language, return_timestamps)
            
            if enable_diarization:
                speakers_info = self.perform_speaker_diarization(audio_path)
                if speakers_info:
                    result["speakers"] = speakers_info
                    result = self._merge_transcription_with_speakers(result)
            
            return result
        except ImportError:
            pass
        except Exception:
            pass
        
        result = self._transcribe_short_audio(audio_path, language, return_timestamps)
        
        if enable_diarization:
            speakers_info = self.perform_speaker_diarization(audio_path)
            if speakers_info:
                result["speakers"] = speakers_info
                result = self._merge_transcription_with_speakers(result)
        
        return result
    
    def _transcribe_short_audio(
        self,
        audio_path: str,
        language: Optional[str] = None,
        return_timestamps: bool = False
    ) -> Dict[str, Any]:
        """Обработка коротких аудио файлов (<90 секунд)"""
        model = self.load_model()
        
        
        segments, info = model.transcribe(
            audio_path,
            language=language,
            task="transcribe",
            beam_size=1,
            best_of=1,
            temperature=0,
            vad_filter=True,
            condition_on_previous_text=False,
            compression_ratio_threshold=2.4,
            log_prob_threshold=-1.0,
            no_speech_threshold=0.6,
            word_timestamps=False,
        )
        
        full_text = []
        all_segments = []
        
        for segment in segments:
            full_text.append(segment.text)
            if return_timestamps:
                all_segments.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip()
                })
        
        result_text = " ".join(full_text).strip()
        
        return {
            "text": result_text,
            "language": info.language,
            "segments": all_segments if return_timestamps else []
        }
    
    def _transcribe_long_audio(
        self,
        audio_path: str,
        language: Optional[str] = None,
        return_timestamps: bool = False,
        duration: float = 0
    ) -> Dict[str, Any]:
        """Обработка длинных аудио файлов с сегментацией и параллельной обработкой"""
        import librosa
        import soundfile as sf
        
        model = self.load_model()
        
        segment_duration = 30.0
        num_segments = int(duration / segment_duration) + 1
        
        
        audio_data, sample_rate = librosa.load(audio_path, sr=16000)
        
        
        def process_segment(segment_idx: int, start_time: float, end_time: float) -> tuple:
            try:
                start_sample = int(start_time * sample_rate)
                end_sample = int(end_time * sample_rate)
                segment_audio = audio_data[start_sample:end_sample]
                
                
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                sf.write(temp_file.name, segment_audio, sample_rate)
                
                
                segments, info = model.transcribe(
                    temp_file.name,
                    language=language,
                    task="transcribe",
                    beam_size=1,
                    best_of=1,
                    temperature=0,
                    vad_filter=True,  
                    condition_on_previous_text=False,
                    word_timestamps=False,
                    compression_ratio_threshold=2.4,
                    log_prob_threshold=-1.0,
                    no_speech_threshold=0.6,
                )
                
                
                segment_texts = []
                segment_data = []
                for seg in segments:
                    segment_texts.append(seg.text)
                    if return_timestamps:
                        segment_data.append({
                            "start": seg.start + start_time,
                            "end": seg.end + start_time,
                            "text": seg.text.strip()
                        })
                
                
                os.unlink(temp_file.name)
                
                return (segment_idx, " ".join(segment_texts), segment_data, info.language)
            except Exception:
                return (segment_idx, "", [], None)
        
        all_texts = []
        all_segments = []
        detected_language = None
        
        max_workers = min(6, num_segments)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for i in range(num_segments):
                start_time = i * segment_duration
                end_time = min((i + 1) * segment_duration, duration)
                future = executor.submit(process_segment, i, start_time, end_time)
                futures.append(future)
            
            
            results = {}
            for future in as_completed(futures):
                seg_idx, text, segs, lang = future.result()
                results[seg_idx] = (text, segs, lang)
                if lang and not detected_language:
                    detected_language = lang
            
            
            for i in range(num_segments):
                if i in results:
                    text, segs, lang = results[i]
                    if text:
                        all_texts.append(text)
                    if return_timestamps:
                        all_segments.extend(segs)
        
        result_text = " ".join(all_texts).strip()
        
        return {
            "text": result_text,
            "language": detected_language or "auto",
            "segments": all_segments if return_timestamps else []
        }
    
    def _merge_transcription_with_speakers(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Объединяет информацию о транскрипции с информацией о спикерах
        Добавляет информацию о спикере к каждому сегменту текста
        """
        if not result.get("speakers") or not result.get("segments"):
            return result
        
        speaker_segments = result["speakers"]["segments"]
        text_segments = result["segments"]
        
        
        for text_seg in text_segments:
            text_start = text_seg["start"]
            text_end = text_seg["end"]
            
            
            best_speaker = None
            max_overlap = 0
            
            for speaker_seg in speaker_segments:
                
                overlap_start = max(text_start, speaker_seg["start"])
                overlap_end = min(text_end, speaker_seg["end"])
                overlap = max(0, overlap_end - overlap_start)
                
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_speaker = speaker_seg["speaker"]
            
            if best_speaker:
                text_seg["speaker"] = best_speaker
        
        
        speaker_text_parts = []
        current_speaker = None
        current_text = []
        
        for seg in text_segments:
            speaker = seg.get("speaker", "Unknown")
            if speaker != current_speaker:
                if current_text:
                    speaker_text_parts.append(f"[{current_speaker}]: {' '.join(current_text)}")
                current_speaker = speaker
                current_text = [seg["text"]]
            else:
                current_text.append(seg["text"])
        
        
        if current_text:
            speaker_text_parts.append(f"[{current_speaker}]: {' '.join(current_text)}")
        
        result["text_with_speakers"] = "\n".join(speaker_text_parts)
        
        return result
    
    def transcribe_video(self, video_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Распознавание речи из видео файла (извлекает аудио)
        
        Args:
            video_path: Путь к видео файлу
            language: Язык аудио
            
        Returns:
            Словарь с результатами распознавания
        """
        
        
        return self.transcribe(video_path, language, return_timestamps=False)


whisper_service = WhisperService()

