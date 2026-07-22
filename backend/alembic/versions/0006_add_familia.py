"""Add the real Familia apartment project gallery.

Revision ID: 0006
Revises: 0005
"""

from alembic import op
import sqlalchemy as sa


revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


MEDIA = [str(number) for number in range(2402, 2419)]


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            INSERT INTO projects
                (slug, title, summary, location, area, year, cover_url, sort_order, published,
                 created_at, updated_at)
            VALUES
                ('familia', 'ЖК Familia',
                 'Тёплый современный интерьер на Петровском острове: натуральное дерево, точная столярка и графичные детали, собранные в спокойное пространство для жизни.',
                 'Петровский остров · Санкт-Петербург', '', '',
                 '/media/projects/familia/img-2402.webp', 6, true,
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                summary = EXCLUDED.summary,
                location = EXCLUDED.location,
                cover_url = EXCLUDED.cover_url,
                sort_order = EXCLUDED.sort_order,
                published = EXCLUDED.published,
                updated_at = CURRENT_TIMESTAMP
            """
        )
    )
    bind.execute(
        sa.text("DELETE FROM project_media WHERE project_id = (SELECT id FROM projects WHERE slug = 'familia')")
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = 'familia'
            """
        ),
        [
            {
                "url": f"/media/projects/familia/img-{name}.webp",
                "alt": f"ЖК Familia — кадр {index + 1}",
                "sort_order": (index + 1) * 10,
            }
            for index, name in enumerate(MEDIA)
        ],
    )


def downgrade() -> None:
    op.get_bind().execute(sa.text("DELETE FROM projects WHERE slug = 'familia'"))
