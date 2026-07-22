"""Remove the rejected second Pavlov SKY photo.

Revision ID: 0005
Revises: 0004
"""

from alembic import op
import sqlalchemy as sa


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            DELETE FROM project_media
            WHERE project_id = (SELECT id FROM projects WHERE slug = 'pavlov-sky')
              AND url = '/media/projects/pavlov-sky/img-2117.webp'
            """
        )
    )


def downgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', '/media/projects/pavlov-sky/img-2117.webp',
                   'Коттеджный поселок Павлов SKY — кадр 2', '', 20, '{}',
                   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = 'pavlov-sky'
            """
        )
    )
