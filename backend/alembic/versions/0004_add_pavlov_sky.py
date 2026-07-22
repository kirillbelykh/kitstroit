"""Add the real Pavlov SKY project gallery.

Revision ID: 0004
Revises: 0003
"""

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


MEDIA = [
    "2085", "2117", "2092", "2335", "2356", "2366", "2363", "2348", "2344", "2357",
    "2359", "2362", "9177", "9179", "9221", "9245", "9162", "9207", "9206", "9209",
    "9210", "9215", "9220", "9180", "9244", "9248", "9249", "9222", "4606", "2081",
]


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            INSERT INTO projects
                (slug, title, summary, location, area, year, cover_url, sort_order, published,
                 created_at, updated_at)
            VALUES
                ('pavlov-sky', 'Коттеджный поселок Павлов SKY',
                 'Дом и окружающая среда, собранные в единый спокойный ритм — от общего силуэта до деталей, которые раскрываются по мере просмотра.',
                 'Ленинградская область', '', '',
                 '/media/projects/pavlov-sky/img-2085.webp', 5, true,
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
        sa.text("DELETE FROM project_media WHERE project_id = (SELECT id FROM projects WHERE slug = 'pavlov-sky')")
    )
    rows = [
        {
            "url": f"/media/projects/pavlov-sky/img-{name}.webp",
            "alt": f"Коттеджный поселок Павлов SKY — кадр {index + 1}",
            "sort_order": (index + 1) * 10,
        }
        for index, name in enumerate(MEDIA)
    ]
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = 'pavlov-sky'
            """
        ),
        rows,
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text("DELETE FROM projects WHERE slug = 'pavlov-sky'"))
