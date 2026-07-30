"""Olimpiyskaya: drop gallery photo img-01 (display position 2).

Revision ID: 0017
Revises: 0016
"""

from alembic import op
import sqlalchemy as sa


revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None

SLUG = "olimpiyskaya"
REMOVE_URL = "/media/projects/olimpiyskaya/img-01.webp"


def upgrade() -> None:
    op.get_bind().execute(
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
    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', 10, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = :slug
            """
        ),
        {
            "url": REMOVE_URL,
            "alt": "Олимпийская улица — кадр 1",
            "slug": SLUG,
        },
    )
