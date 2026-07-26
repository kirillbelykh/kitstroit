import sqlite3

from alembic import command
from alembic.config import Config
from app.config import get_settings

ATTRIBUTION_COLUMNS = {
    "ym_client_id",
    "yclid",
    "landing_page",
    "referrer",
    "page_url",
    "cta",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "first_utm_source",
    "first_utm_medium",
    "first_utm_campaign",
    "first_utm_content",
    "first_utm_term",
    "first_landing_page",
    "first_referrer",
}


def _lead_columns(database):
    with sqlite3.connect(database) as connection:
        return {row[1] for row in connection.execute("PRAGMA table_info(leads)")}


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
        bezobrazov_media = connection.execute(
            "SELECT COUNT(*) FROM project_media "
            "WHERE project_id = (SELECT id FROM projects WHERE slug = 'dom-bezobrazova-repino')"
        ).fetchone()[0]
        lead_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(leads)")
        }

    assert section_keys == {"hero", "proof", "process", "guarantee", "founder", "lead"}
    assert setting_keys == {"phone", "phone_href", "telegram", "email", "work_hours", "region"}
    assert len(projects) == 6
    assert all(published for _, _, published in projects)
    assert pavlov_media == 29
    assert familia_media == 17
    assert bezobrazov_media == 26
    assert ATTRIBUTION_COLUMNS.issubset(lead_columns)


def test_alembic_0009_downgrade_and_reupgrade_on_tmp_sqlite(tmp_path, monkeypatch):
    """0009 is additive nullable-only: columns appear on upgrade and disappear on downgrade."""
    database = tmp_path / "migration-roundtrip.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{database}")
    get_settings.cache_clear()
    config = Config("alembic.ini")

    command.upgrade(config, "head")
    assert ATTRIBUTION_COLUMNS.issubset(_lead_columns(database))

    command.downgrade(config, "0008")
    after_down = _lead_columns(database)
    assert ATTRIBUTION_COLUMNS.isdisjoint(after_down)

    command.upgrade(config, "head")
    assert ATTRIBUTION_COLUMNS.issubset(_lead_columns(database))
    get_settings.cache_clear()
