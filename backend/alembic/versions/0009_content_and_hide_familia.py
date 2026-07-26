"""Update public copy, CTAs, and hide Familia project.

Revision ID: 0009
Revises: 0008
"""

from alembic import op
import sqlalchemy as sa


revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET cta_label = 'Обсудить строительство',
                updated_at = CURRENT_TIMESTAMP
            WHERE key = 'hero'
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET body = :body,
                updated_at = CURRENT_TIMESTAMP
            WHERE key = 'founder'
            """
        ),
        {
            "body": (
                "Я лично знакомлюсь с каждым проектом и остаюсь на связи до передачи ключей. "
                "Для меня хороший дом — не эффектная картинка, а точная система, которая каждый день "
                "делает жизнь семьи проще."
            )
        },
    )
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET published = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = 'familia'
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET published = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = 'familia'
            """
        )
    )
