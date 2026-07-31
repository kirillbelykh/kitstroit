"""Rename Suzdalskoe project to Ohta Park; drop photo 16.

Revision ID: 0018
Revises: 0017
"""

from alembic import op
import sqlalchemy as sa


revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None

SLUG = "suzdalskoe-12"
TITLE = "Охта Парк"
REMOVE_URL = "/media/projects/suzdalskoe-12/img-16.webp"


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET title = :title,
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = :slug
            """
        ),
        {"title": TITLE, "slug": SLUG},
    )
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


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET title = 'Суздальское шоссе 12',
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = :slug
            """
        ),
        {"slug": SLUG},
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', 160, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = :slug
            """
        ),
        {
            "url": REMOVE_URL,
            "alt": "Суздальское шоссе 12 — кадр 16",
            "slug": SLUG,
        },
    )
