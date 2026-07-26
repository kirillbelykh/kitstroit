"""Remove Dom Bezobrazova gallery photo #5.

Revision ID: 0011
Revises: 0010
"""

from alembic import op
import sqlalchemy as sa


revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None

PHOTO_URL = "/media/projects/dom-bezobrazova-repino/img-05.webp"


def upgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            DELETE FROM project_media
            WHERE url = :url
              AND project_id = (SELECT id FROM projects WHERE slug = 'dom-bezobrazova-repino')
            """
        ),
        {"url": PHOTO_URL},
    )


def downgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = 'dom-bezobrazova-repino'
            """
        ),
        {
            "url": PHOTO_URL,
            "alt": "Дом А. Б. Безобразова в Репино — кадр 5",
            "sort_order": 50,
        },
    )
