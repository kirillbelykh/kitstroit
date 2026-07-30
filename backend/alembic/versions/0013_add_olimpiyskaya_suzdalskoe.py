"""Add Олимпийская and Суздальское шоссе finished project galleries.

Revision ID: 0013
Revises: 0012
"""

from alembic import op
import sqlalchemy as sa


revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


OLIMPIYSKAYA_COUNT = 10
SUZDALSKOE_COUNT = 19


def _insert_project(bind, *, slug: str, title: str, summary: str, location: str, cover_url: str, sort_order: int) -> None:
    bind.execute(
        sa.text(
            """
            INSERT INTO projects
                (slug, title, summary, location, area, year, cover_url, sort_order, published,
                 created_at, updated_at)
            VALUES
                (:slug, :title, :summary, :location, '', '', :cover_url, :sort_order, true,
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
        ),
        {
            "slug": slug,
            "title": title,
            "summary": summary,
            "location": location,
            "cover_url": cover_url,
            "sort_order": sort_order,
        },
    )


def _replace_media(bind, *, slug: str, title: str, count: int) -> None:
    bind.execute(
        sa.text(
            "DELETE FROM project_media "
            "WHERE project_id = (SELECT id FROM projects WHERE slug = :slug)"
        ),
        {"slug": slug},
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO project_media
                (project_id, kind, url, alt, poster_url, sort_order, extra, created_at, updated_at)
            SELECT id, 'image', :url, :alt, '', :sort_order, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM projects WHERE slug = :slug
            """
        ),
        [
            {
                "slug": slug,
                "url": f"/media/projects/{slug}/img-{index:02d}.webp",
                "alt": f"{title} — кадр {index}",
                "sort_order": index * 10,
            }
            for index in range(1, count + 1)
        ],
    )


def upgrade() -> None:
    bind = op.get_bind()
    _insert_project(
        bind,
        slug="olimpiyskaya",
        title="Олимпийская улица",
        summary=(
            "Готовый загородный дом на Олимпийской улице: спокойный фасад, "
            "аккуратная посадка на участке и интерьеры, собранные под повседневную жизнь семьи."
        ),
        location="Санкт-Петербург и ЛО",
        cover_url="/media/projects/olimpiyskaya/img-05.webp",
        sort_order=8,
    )
    _replace_media(
        bind,
        slug="olimpiyskaya",
        title="Олимпийская улица",
        count=OLIMPIYSKAYA_COUNT,
    )

    _insert_project(
        bind,
        slug="suzdalskoe-12",
        title="Суздальское шоссе 12",
        summary=(
            "Завершённый дом на Суздальском шоссе, 12 — с выразительным объёмом, "
            "чёткими фасадными решениями и вниманием к деталям на сдаче."
        ),
        location="Санкт-Петербург и ЛО",
        cover_url="/media/projects/suzdalskoe-12/img-19.webp",
        sort_order=9,
    )
    _replace_media(
        bind,
        slug="suzdalskoe-12",
        title="Суздальское шоссе 12",
        count=SUZDALSKOE_COUNT,
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text("DELETE FROM projects WHERE slug IN ('olimpiyskaya', 'suzdalskoe-12')"))
