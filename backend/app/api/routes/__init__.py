from fastapi import APIRouter
from app.api.routes import upload, recognize, translate, process, tts, test, process_fast, process_quick

api_router = APIRouter()

api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(recognize.router, prefix="/recognize", tags=["recognize"])
api_router.include_router(translate.router, prefix="/translate", tags=["translate"])
api_router.include_router(process.router, prefix="/process", tags=["process"])
api_router.include_router(process_fast.router, prefix="/process", tags=["process"])
api_router.include_router(process_quick.router, prefix="/process", tags=["process"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(test.router, prefix="/test", tags=["test"])

