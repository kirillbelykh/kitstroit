"""Olimpiyskaya: drop photo 2, set photo 8 as cover/first.

Revision ID: 0015
Revises: 0014
"""

from alembic import op
import sqlalchemy as sa


revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None

SLUG = "olimpiyskaya"
REMOVE_URL = "/media/projects/olimpiyskaya/img-02.webp"
COVER_URL = "/media/projects/olimpiyskaya/img-08.webp"


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            DELETE FROM project_media
            WHERE url = :url
              AND project_id = (SELECT id FROM projects WHERE slug = :slug)
            """
        ),
        {"url": REMOVE_URL, "slug": SLUG},
    )
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET cover_url = :cover_url,
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = :slug
            """
        ),
        {"cover_url": COVER_URL, "slug": SLUG},
    )
    bind.execute(
        sa.text(
            """
            UPDATE project_media
            SET sort_order = 5,
                updated_at = CURRENT_TIMESTAMP
            WHERE url = :cover_url
              AND project_id = (SELECT id FROM projects WHERE slug = :slug)
            """
        ),
        {"cover_url": COVER_URL, "slug": SLUG},
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET cover_url = '/media/projects/olimpiyskaya/img-05.webp',
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = :slug
            """
        ),
        {"slug": SLUG},
    )
    bind.execute(
        sa.text(
            """
            UPDATE project_media
            SET sort_order = 80,
                updated_at = CURRENT_TIMESTAMP
            WHERE url = :cover_url
              AND project_id = (SELECT id FROM projects WHERE slug = :slug)
            """
        ),
        {"cover_url": COVER_URL, "slug": SLUG},
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', 20, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = :slug
            """
        ),
        {
            "url": REMOVE_URL,
            "alt": "Олимпийская улица — кадр 2",
            "slug": SLUG,
        },
    )
