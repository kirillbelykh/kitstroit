"""Suzdalskoe: drop gallery photos 13 and 15.

Revision ID: 0016
Revises: 0015
"""

from alembic import op
import sqlalchemy as sa


revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None

SLUG = "suzdalskoe-12"
REMOVE_URLS = (
    "/media/projects/suzdalskoe-12/img-13.webp",
    "/media/projects/suzdalskoe-12/img-15.webp",
)


def upgrade() -> None:
    bind = op.get_bind()
    for url in REMOVE_URLS:
        bind.execute(
            sa.text(
                """
                DELETE FROM project_media
                WHERE url = :url
                  AND project_id = (SELECT id FROM projects WHERE slug = :slug)
                """
            ),
            {"url": url, "slug": SLUG},
        )


def downgrade() -> None:
    bind = op.get_bind()
    for url, sort_order, frame in (
        (REMOVE_URLS[0], 130, 13),
        (REMOVE_URLS[1], 150, 15),
    ):
        bind.execute(
            sa.text(
                """
                INSERT INTO project_media
                    (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
                SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM projects WHERE slug = :slug
                """
            ),
            {
                "url": url,
                "alt": f"Суздальское шоссе 12 — кадр {frame}",
                "sort_order": sort_order,
                "slug": SLUG,
            },
        )
