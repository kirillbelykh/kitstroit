import sqlite3

from alembic import command
from alembic.config import Config
from app.config import get_settings


def test_alembic_upgrade_head_seeds_initial_content(tmp_path, monkeypatch):
    database = tmp_path / "migration.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{database}")
    get_settings.cache_clear()
    config = Config("alembic.ini")
    command.upgrade(config, "head")
    command.upgrade(config, "head")
    get_settings.cache_clear()

    with sqlite3.connect(database) as connection:
        section_keys = {row[0] for row in connection.execute("SELECT key FROM text_sections")}
        setting_keys = {row[0] for row in connection.execute("SELECT key FROM site_settings")}
        projects = connection.execute("SELECT slug, summary, published FROM projects").fetchall()
        pavlov_media = connection.execute(
            "SELECT COUNT(*) FROM project_media WHERE project_id = (SELECT id FROM projects WHERE slug = 'pavlov-sky')"
        ).fetchone()[0]
        familia_media = connection.execute(
            "SELECT COUNT(*) FROM project_media WHERE project_id = (SELECT id FROM projects WHERE slug = 'familia')"
        ).fetchone()[0]

    assert section_keys == {"hero", "proof", "process", "guarantee", "founder", "lead"}
    assert setting_keys == {"phone", "phone_href", "telegram", "email", "work_hours", "region"}
    assert len(projects) == 5
    assert all(published for _, _, published in projects)
    assert pavlov_media == 29
    assert familia_media == 17
