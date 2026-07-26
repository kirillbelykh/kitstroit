"""Refresh Dom Bezobrazova gallery from full-resolution source photos.

Revision ID: 0008
Revises: 0007
"""

from alembic import op
import sqlalchemy as sa


revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


MEDIA_COUNT = 26


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET cover_url = '/media/projects/dom-bezobrazova-repino/img-01.webp',
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = 'dom-bezobrazova-repino'
            """
        )
    )
    bind.execute(
        sa.text(
            "DELETE FROM project_media "
            "WHERE project_id = (SELECT id FROM projects WHERE slug = 'dom-bezobrazova-repino')"
        )
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = 'dom-bezobrazova-repino'
            """
        ),
        [
            {
                "url": f"/media/projects/dom-bezobrazova-repino/img-{index:02d}.webp",
                "alt": f"Дом А. Б. Безобразова в Репино — кадр {index}",
                "sort_order": index * 10,
            }
            for index in range(1, MEDIA_COUNT + 1)
        ],
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "DELETE FROM project_media "
            "WHERE project_id = (SELECT id FROM projects WHERE slug = 'dom-bezobrazova-repino')"
        )
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = 'dom-bezobrazova-repino'
            """
        ),
        [
            {
                "url": f"/media/projects/dom-bezobrazova-repino/img-{index:02d}.webp",
                "alt": f"Дом А. Б. Безобразова в Репино — кадр {index}",
                "sort_order": index * 10,
            }
            for index in range(1, 22)
        ],
    )
