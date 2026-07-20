import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.config import Settings, get_settings
from app.db import Base, get_session
from app.main import app
from app.rate_limit import lead_limiter, login_limiter


@pytest_asyncio.fixture
async def client(tmp_path):
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def test_session():
        async with sessions() as session:
            yield session

    test_settings = Settings(
        database_url="sqlite+aiosqlite://",
        admin_username="admin",
        admin_password_hash=PasswordHash.recommended().hash("correct horse battery staple"),
        jwt_secret="x" * 40,
        cookie_secure=False,
        telegram_bot_token="",
        upload_dir=tmp_path,
    )
    lead_limiter.clear()
    login_limiter.clear()
    app.dependency_overrides[get_session] = test_session
    app.dependency_overrides[get_settings] = lambda: test_settings
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as api_client:
        yield api_client
    app.dependency_overrides.clear()
    lead_limiter.clear()
    login_limiter.clear()
    await engine.dispose()
