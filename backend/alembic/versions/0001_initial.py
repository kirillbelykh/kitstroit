"""Initial schema.

Revision ID: 0001
Revises:
"""
from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def timestamps():
    return (
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False),
        sa.Column("project_type", sa.String(100)),
        sa.Column("message", sa.Text()),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("consent", sa.Boolean(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_leads_phone", "leads", ["phone"])
    op.create_index("ix_leads_status", "leads", ["status"])
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False, unique=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("location", sa.String(200), nullable=False),
        sa.Column("area", sa.String(100), nullable=False),
        sa.Column("year", sa.String(20), nullable=False),
        sa.Column("cover_url", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_projects_slug", "projects", ["slug"], unique=True)
    op.create_index("ix_projects_published", "projects", ["published"])
    op.create_table(
        "project_media",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("alt", sa.String(300), nullable=False),
        sa.Column("poster_url", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("extra", sa.JSON(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_project_media_project_id", "project_media", ["project_id"])
    op.create_table(
        "text_sections",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("eyebrow", sa.String(200), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("cta_label", sa.String(100), nullable=False),
        sa.Column("cta_url", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_text_sections_key", "text_sections", ["key"], unique=True)
    op.create_table(
        "site_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("public", sa.Boolean(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_site_settings_key", "site_settings", ["key"], unique=True)
    op.create_index("ix_site_settings_public", "site_settings", ["public"])
    op.create_table(
        "telegram_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("bot_username", sa.String(100), nullable=False),
        sa.Column("admin_chat_ids", sa.JSON(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        *timestamps(),
    )


def downgrade() -> None:
    op.drop_table("telegram_settings")
    op.drop_table("site_settings")
    op.drop_table("text_sections")
    op.drop_table("project_media")
    op.drop_table("projects")
    op.drop_table("leads")

