"""Add the Dom Bezobrazova project gallery.

Revision ID: 0007
Revises: 0006
"""

from alembic import op
import sqlalchemy as sa


revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


MEDIA_COUNT = 21


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            INSERT INTO projects
                (slug, title, summary, location, area, year, cover_url, sort_order, published,
                 created_at, updated_at)
            VALUES
                ('dom-bezobrazova-repino', 'Дом А. Б. Безобразова',
                 'Загородный дом в Репино с выразительным кирпичным фасадом, классическими деталями и светлыми интерьерами, собранными вокруг естественного света и спокойной повседневной жизни.',
                 'Репино · Санкт-Петербург', '', '',
                 '/media/projects/dom-bezobrazova-repino/img-01.webp', 7, true,
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
    op.get_bind().execute(
        sa.text("DELETE FROM projects WHERE slug = 'dom-bezobrazova-repino'")
    )
