"""Ohta Park: drop kitchen photo img-17 (gallery position 15).

Revision ID: 0019
Revises: 0018
"""

from alembic import op
import sqlalchemy as sa


revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None

SLUG = "suzdalskoe-12"
REMOVE_URL = "/media/projects/suzdalskoe-12/img-17.webp"


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
            SELECT id, 'image', :url, :alt, '', 170, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = :slug
            """
        ),
        {
            "url": REMOVE_URL,
            "alt": "Охта Парк — кадр 17",
            "slug": SLUG,
        },
    )
