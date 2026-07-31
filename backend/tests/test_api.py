async def login(client):
    response = await client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "correct horse battery staple"},
    )
    assert response.status_code == 204


async def test_lead_requires_consent_and_is_visible_to_admin(client):
    rejected = await client.post(
        "/api/leads",
        json={"name": "Иван", "phone": "+7 999 123-45-67", "consent": False},
    )
    assert rejected.status_code == 422

    created = await client.post(
        "/api/leads",
        json={"name": "Иван", "phone": "+7 999 123-45-67", "project_type": "Дом", "consent": True},
    )
    assert created.status_code == 201
    await login(client)
    leads = await client.get("/api/admin/leads")
    assert leads.status_code == 200
    assert leads.json()[0]["phone"] == "+7 999 123-45-67"


async def test_lead_stores_attribution_fields(client):
    created = await client.post(
        "/api/leads",
        json={
            "name": "Анна",
            "phone": "+7 999 555-44-33",
            "project_type": "Дом",
            "consent": True,
            "ym_client_id": "1234567890123456789",
            "yclid": "yclid-test-1",
            "landing_page": "https://kitstroit.ru/?utm_source=yandex",
            "referrer": "https://yandex.ru/",
            "page_url": "https://kitstroit.ru/#lead",
            "cta": "hero_calculate",
            "utm_source": "yandex",
            "utm_medium": "cpc",
            "utm_campaign": "homes",
            "utm_content": "banner",
            "utm_term": "дом под ключ",
            "first_utm_source": "yandex",
            "first_utm_medium": "cpc",
            "first_utm_campaign": "homes",
            "first_utm_content": "banner",
            "first_utm_term": "дом под ключ",
            "first_landing_page": "https://kitstroit.ru/?utm_source=yandex",
            "first_referrer": "https://yandex.ru/",
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert body["utm_source"] == "yandex"
    assert body["utm_campaign"] == "homes"
    assert body["yclid"] == "yclid-test-1"
    assert body["ym_client_id"] == "1234567890123456789"
    assert body["cta"] == "hero_calculate"
    assert body["first_utm_source"] == "yandex"

    await login(client)
    leads = await client.get("/api/admin/leads")
    assert leads.status_code == 200
    stored = next(item for item in leads.json() if item["phone"] == "+7 999 555-44-33")
    assert stored["yclid"] == "yclid-test-1"
    assert stored["landing_page"] == "https://kitstroit.ru/?utm_source=yandex"
    assert stored["page_url"] == "https://kitstroit.ru/#lead"
    assert stored["utm_medium"] == "cpc"
    assert stored["first_landing_page"] == "https://kitstroit.ru/?utm_source=yandex"


async def test_project_admin_crud_controls_public_content(client):
    unauthorized = await client.get("/api/admin/projects")
    assert unauthorized.status_code == 401
    await login(client)
    created = await client.post(
        "/api/admin/projects",
        json={"slug": "forest-house", "title": "Дом в лесу", "published": True},
    )
    assert created.status_code == 201
    project_id = created.json()["id"]
    media = await client.post(
        f"/api/admin/projects/{project_id}/media",
        json={"kind": "image", "url": "/media/forest.webp", "alt": "Дом в лесу"},
    )
    assert media.status_code == 201
    patched = await client.patch(f"/api/admin/projects/{project_id}", json={"title": "Лесной дом"})
    assert patched.status_code == 200
    assert patched.json()["slug"] == "forest-house"

    content = await client.get("/api/content")
    assert content.status_code == 200
    assert content.json()["projects"][0]["media"][0]["url"] == "/media/forest.webp"


async def test_admin_ui_project_payload_coerces_numeric_year_area(client):
    """Admin form historically sent year/area as numbers; create/edit must accept them."""
    await login(client)
    created = await client.post(
        "/api/admin/projects",
        json={
            "slug": "numeric-fields",
            "title": "Числовые поля",
            "summary": "",
            "location": "ЛО",
            "area": 186,
            "year": 2026,
            "cover_url": "",
            "sort_order": 0,
            "published": False,
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["area"] == "186"
    assert body["year"] == "2026"
    project_id = body["id"]

    listed = await client.get("/api/admin/projects")
    assert listed.status_code == 200
    project = next(item for item in listed.json() if item["id"] == project_id)
    project["title"] = "Обновлённый"
    project["area"] = 200
    project["year"] = 2025
    patched = await client.patch(f"/api/admin/projects/{project_id}", json=project)
    assert patched.status_code == 200, patched.text
    assert patched.json()["title"] == "Обновлённый"
    assert patched.json()["area"] == "200"
    assert patched.json()["year"] == "2025"

    deleted_media = await client.post(
        f"/api/admin/projects/{project_id}/media",
        json={"kind": "image", "url": "/media/numeric.webp", "alt": "x"},
    )
    assert deleted_media.status_code == 201
    media_id = deleted_media.json()["id"]
    removed = await client.delete(f"/api/admin/media/{media_id}")
    assert removed.status_code == 204



async def test_telegram_notification_escapes_lead_data(monkeypatch):
    from app import telegram

    sent = []

    class Response:
        def raise_for_status(self):
            pass

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, json):
            sent.append((url, json))
            return Response()

    monkeypatch.setattr(telegram.httpx, "AsyncClient", lambda **kwargs: Client())
    await telegram.notify_new_lead(
        "test-token",
        [1, 2],
        {"name": "<Иван>", "phone": "+7 999 123-45-67", "project_type": "Дом", "message": "<b>hello</b>"},
    )
    assert len(sent) == 2
    assert "&lt;Иван&gt;" in sent[0][1]["text"]
    assert "<b>hello</b>" not in sent[0][1]["text"]

    sent.clear()
    await telegram.notify_new_lead(
        "test-token",
        [1],
        {
            "name": "Анна",
            "phone": "+7 999 000-11-22",
            "project_type": "Дом",
            "message": "Хочу смету",
            "utm_source": "yandex",
            "utm_campaign": "homes<script>",
            "yclid": "yclid-42",
            "ym_client_id": "999",
            "landing_page": "https://kitstroit.ru/",
        },
    )
    text = sent[0][1]["text"]
    assert "Атрибуция" in text
    assert "Источник: yandex" in text
    assert "Кампания: homes&lt;script&gt;" in text
    assert "yclid: yclid-42" in text
    assert "ClientID: 999" in text
    assert "Landing: https://kitstroit.ru/" in text
    assert "<script>" not in text


async def test_admin_upload_accepts_image_and_rejects_other_types(client, tmp_path, monkeypatch):
    await login(client)
    uploaded = await client.post(
        "/api/admin/uploads",
        files={"file": ("house.webp", b"RIFF-test-image", "image/webp")},
    )
    assert uploaded.status_code == 201
    body = uploaded.json()
    assert body["kind"] == "image"
    assert (tmp_path / body["url"].rsplit("/", 1)[-1]).read_bytes() == b"RIFF-test-image"

    rejected = await client.post(
        "/api/admin/uploads",
        files={"file": ("page.html", b"<script>alert(1)</script>", "text/html")},
    )
    assert rejected.status_code == 415

    from app import api

    monkeypatch.setitem(api.UPLOAD_TYPES, "image/webp", ("image", ".webp", 4))
    oversized = await client.post(
        "/api/admin/uploads",
        files={"file": ("large.webp", b"12345", "image/webp")},
    )
    assert oversized.status_code == 413
    assert not list(tmp_path.glob("*.part"))


async def test_lead_honeypot_and_rate_limit_reject_bots(client):
    bot = await client.post(
        "/api/leads",
        json={"name": "Bot", "phone": "+7 999 111-22-33", "consent": True, "website": "spam.example"},
    )
    assert bot.status_code == 422

    payload = {"name": "Иван", "phone": "+7 999 111-22-33", "consent": True}
    # The rejected honeypot attempt also consumes one limiter slot by design.
    for _ in range(4):
        assert (await client.post("/api/leads", json=payload)).status_code == 201
    assert (await client.post("/api/leads", json=payload)).status_code == 429

    # Caddy supplies X-Forwarded-For, so another visitor must have an independent bucket.
    fresh = await client.post("/api/leads", json=payload, headers={"x-forwarded-for": "203.0.113.42"})
    assert fresh.status_code == 201
