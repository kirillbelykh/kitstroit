# Backend KitStroit

```bash
cp .env.example .env
# заполните обязательные значения в .env
uv sync
uv run python -m app.security hash-password
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Хеш пароля администратора, JWT-секрет и токен Telegram должны находиться только в `.env` или в хранилище секретов целевой среды. Документация API доступна по адресу `/docs` во всех режимах, кроме production.

Каталог `UPLOAD_DIR` следует подключать как постоянный Docker volume. Административная панель принимает изображения JPEG, PNG, WebP и AVIF размером до 15 МБ, а также видео MP4 и WebM размером до 100 МБ.
