"""Update public copy for houses + apartment finishing.

Revision ID: 0014
Revises: 0013
"""

from alembic import op
import sqlalchemy as sa


revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET eyebrow = '',
                body = :body,
                updated_at = CURRENT_TIMESTAMP
            WHERE key = 'hero'
            """
        ),
        {"body": "Строительство домов и отделка квартир под ключ с 2013 года"},
    )
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET body = :body,
                updated_at = CURRENT_TIMESTAMP
            WHERE key = 'process'
            """
        ),
        {
            "body": (
                "Дом или квартира → проект и смета → работы и контроль → сдача. "
                "Каждый этап имеет результат и точку приёмки."
            )
        },
    )
    bind.execute(
        sa.text(
            """
            UPDATE projects
            SET summary = '',
                updated_at = CURRENT_TIMESTAMP
            WHERE published = true
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE text_sections
            SET eyebrow = 'Архитектура для жизни · с 2013',
                body = 'Продумываем проект, фиксируем стоимость договором и строим дом как единую систему.',
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
            WHERE key = 'process'
            """
        ),
        {
            "body": (
                "Участок и задача → проект и смета → команда и материалы → строительство и сдача. "
                "Каждый этап имеет результат и точку контроля."
            )
        },
    )
