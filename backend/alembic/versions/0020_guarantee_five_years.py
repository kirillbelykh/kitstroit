"""Set public guarantee copy to 5 years.

Revision ID: 0020
Revises: 0019
"""

from alembic import op
import sqlalchemy as sa


revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            UPDATE text_sections
            SET title = 'Цена, сроки и гарантия 5 лет',
                updated_at = CURRENT_TIMESTAMP
            WHERE key = 'guarantee'
            """
        )
    )


def downgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            UPDATE text_sections
            SET title = 'Цена, сроки и гарантия 10 лет',
                updated_at = CURRENT_TIMESTAMP
            WHERE key = 'guarantee'
            """
        )
    )
