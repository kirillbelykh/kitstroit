# Kitstroit backend

```bash
cp .env.example .env
uv sync
uv run python -m app.security hash-password
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The password hash, JWT secret and Telegram token belong only in `.env` or the
deployment secret store. API documentation is available at `/docs` outside
production.

Persist `UPLOAD_DIR` as a Docker volume. Admin uploads accept JPEG, PNG, WebP,
AVIF (up to 15 MB) and MP4/WebM (up to 100 MB).
