"""Seed initial public content.

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


SECTIONS = [
    {
        "key": "hero",
        "eyebrow": "Архитектура для жизни · с 2016",
        "title": "Строительство домов под ключ с фиксированной сметой",
        "body": "Продумываем проект, фиксируем стоимость договором и строим дом как единую систему.",
        "cta_label": "Обсудить строительство",
        "cta_url": "#lead",
        "sort_order": 10,
    },
    {
        "key": "proof",
        "eyebrow": "Опыт в цифрах",
        "title": "10 лет строим дома для жизни",
        "body": "120+ завершённых проектов. Экономия 12–18% за счёт точной сметы и закупок под проект.",
        "cta_label": "Смотреть проекты",
        "cta_url": "#projects",
        "sort_order": 20,
    },
    {
        "key": "process",
        "eyebrow": "Как мы работаем",
        "title": "Система, а не импровизация",
        "body": "Участок и задача → проект и смета → команда и материалы → строительство и сдача. Каждый этап имеет результат и точку контроля.",
        "cta_label": "",
        "cta_url": "",
        "sort_order": 40,
    },
    {
        "key": "guarantee",
        "eyebrow": "Закрепляем договором",
        "title": "Цена, сроки и гарантия 3 года",
        "body": "Фиксируем смету и календарный план, принимаем поэтапную оплату, подтверждаем скрытые работы актами и фотографиями.",
        "cta_label": "",
        "cta_url": "",
        "sort_order": 50,
    },
    {
        "key": "founder",
        "eyebrow": "Основатель KitStroit",
        "title": "Человек, который отвечает за результат",
        "body": "Савин Никита Владимирович лично знакомится с каждым проектом и остаётся на связи до сдачи дома. Его подход — дом как продуманная система, а не набор отдельных работ.",
        "cta_label": "Поговорить о доме",
        "cta_url": "#lead",
        "sort_order": 60,
    },
    {
        "key": "lead",
        "eyebrow": "Начнём с разговора",
        "title": "Поговорим о вашем доме",
        "body": "Оставьте телефон — свяжемся в рабочее время, уточним задачу и договоримся о следующем шаге.",
        "cta_label": "Отправить заявку",
        "cta_url": "#lead-form",
        "sort_order": 70,
    },
]

SETTINGS = [
    {"key": "phone", "value": "8 (965) 013-03-33"},
    {"key": "phone_href", "value": "tel:+79650130333"},
    {"key": "telegram", "value": "@kit_comfort"},
    {"key": "email", "value": "info@kitstroit.ru"},
    {"key": "work_hours", "value": "Ежедневно · 09:00–21:00"},
    {"key": "region", "value": "Санкт-Петербург и Ленинградская область"},
]

PROJECTS = [
    {
        "slug": "house-by-the-lake",
        "title": "Дом у озера",
        "cover_url": "/media/project-lake.jpg",
        "sort_order": 10,
    },
    {
        "slug": "house-with-courtyard",
        "title": "Дом с внутренним двором",
        "cover_url": "/media/project-courtyard.jpg",
        "sort_order": 20,
    },
    {
        "slug": "forest-cabin",
        "title": "Лесной дом",
        "cover_url": "/media/project-cabin.jpg",
        "sort_order": 30,
    },
]


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            INSERT INTO text_sections
                (key, eyebrow, title, body, cta_label, cta_url, sort_order, enabled, created_at, updated_at)
            VALUES
                (:key, :eyebrow, :title, :body, :cta_label, :cta_url, :sort_order, true,
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO NOTHING
            """
        ),
        SECTIONS,
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO site_settings (key, value, public, created_at, updated_at)
            VALUES (:key, :value, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO NOTHING
            """
        ),
        SETTINGS,
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO projects
                (slug, title, summary, location, area, year, cover_url, sort_order, published,
                 created_at, updated_at)
            VALUES
                (:slug, :title, 'Визуальная концепция', 'Санкт-Петербург и Ленинградская область',
                 '', '', :cover_url, :sort_order, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (slug) DO NOTHING
            """
        ),
        PROJECTS,
    )


def downgrade() -> None:
    bind = op.get_bind()
    text_sections = sa.table("text_sections", sa.column("key", sa.String()))
    site_settings = sa.table("site_settings", sa.column("key", sa.String()))
    projects = sa.table("projects", sa.column("slug", sa.String()))
    bind.execute(text_sections.delete().where(text_sections.c.key.in_([row["key"] for row in SECTIONS])))
    bind.execute(site_settings.delete().where(site_settings.c.key.in_([row["key"] for row in SETTINGS])))
    bind.execute(projects.delete().where(projects.c.slug.in_([row["slug"] for row in PROJECTS])))
