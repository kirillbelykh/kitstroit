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
