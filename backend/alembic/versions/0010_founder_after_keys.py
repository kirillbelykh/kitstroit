"""Clarify founder stays in touch after key handover.

Revision ID: 0010
Revises: 0009
"""

from alembic import op
import sqlalchemy as sa


revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.get_bind().execute(
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
                "Я лично знакомлюсь с каждым проектом и остаюсь на связи до передачи ключей и после неё. "
                "Для меня хороший дом — не эффектная картинка, а точная система, которая каждый день "
                "делает жизнь семьи проще."
            )
        },
    )


def downgrade() -> None:
    op.get_bind().execute(
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
