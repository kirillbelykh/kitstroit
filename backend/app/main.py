from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import router
from .config import get_settings


settings = get_settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
app = FastAPI(
    title="Kitstroit API",
    version="0.1.0",
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(router)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
