"""
Предзагрузка моделей при старте сервера для ускорения первого запроса
"""
import asyncio
from app.services.whisper_service import whisper_service
from app.services.ocr_service import ocr_service
from app.services.translation_service import translation_service


async def preload_models():
    """Предзагрузка всех моделей в фоновом режиме"""
    async def load_whisper():
        try:
            whisper_service.load_model()
        except Exception:
            pass
    
    async def load_ocr():
        try:
            ocr_service.load_model()
        except Exception:
            pass
    
    async def load_translation():
        try:
            translation_service.load_model()
        except Exception:
            pass
    
    await asyncio.gather(
        load_whisper(),
        load_ocr(),
        load_translation(),
        return_exceptions=True
    )


def preload_models_sync():
    """Синхронная предзагрузка моделей (для использования в startup event)"""
    import threading
    
    def load_in_thread():
        try:
            whisper_service.load_model()
            ocr_service.load_model()
            translation_service.load_model()
        except Exception:
            pass
    
    
    thread = threading.Thread(target=load_in_thread, daemon=True)
    thread.start()

