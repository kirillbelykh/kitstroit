from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+asyncpg://kitstroit:kitstroit@localhost:5432/kitstroit"
    cors_origins: str = "http://localhost:5173"
    admin_username: str = "admin"
    admin_password_hash: str = ""
    jwt_secret: str = Field(default="", min_length=0)
    jwt_ttl_minutes: int = Field(default=720, ge=15, le=10_080)
    cookie_secure: bool = True
    telegram_bot_token: str = ""
    upload_dir: Path = Path("uploads")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
