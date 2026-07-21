"""Update public experience and warranty facts.

Revision ID: 0003
Revises: 0002
"""

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET eyebrow = REPLACE(eyebrow, 'с 2016', 'с 2013'),
                title = REPLACE(REPLACE(title, '10 лет строим', '13 лет строим'), 'гарантия 3 года', 'гарантия 10 лет'),
                body = REPLACE(REPLACE(body, '3 года гарантии', '10 лет гарантии'), 'гарантия 3 года', 'гарантия 10 лет'),
                updated_at = CURRENT_TIMESTAMP
            WHERE eyebrow LIKE '%2016%'
               OR title LIKE '%10 лет строим%'
               OR title LIKE '%гарантия 3 года%'
               OR body LIKE '%3 года гарантии%'
               OR body LIKE '%гарантия 3 года%'
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET eyebrow = REPLACE(eyebrow, 'с 2013', 'с 2016'),
                title = REPLACE(REPLACE(title, '13 лет строим', '10 лет строим'), 'гарантия 10 лет', 'гарантия 3 года'),
                body = REPLACE(REPLACE(body, '10 лет гарантии', '3 года гарантии'), 'гарантия 10 лет', 'гарантия 3 года'),
                updated_at = CURRENT_TIMESTAMP
            WHERE eyebrow LIKE '%2013%'
               OR title LIKE '%13 лет строим%'
               OR title LIKE '%гарантия 10 лет%'
               OR body LIKE '%10 лет гарантии%'
               OR body LIKE '%гарантия 10 лет%'
            """
        )
    )
