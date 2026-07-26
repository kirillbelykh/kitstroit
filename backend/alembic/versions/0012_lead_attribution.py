"""Add lead attribution columns for UTM / Metrika.

Revision ID: 0012
Revises: 0011
"""

from alembic import op
import sqlalchemy as sa


revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


COLUMNS: list[tuple[str, sa.types.TypeEngine]] = [
    ("ym_client_id", sa.String(64)),
    ("yclid", sa.String(128)),
    ("landing_page", sa.String(500)),
    ("referrer", sa.String(500)),
    ("page_url", sa.String(500)),
    ("cta", sa.String(120)),
    ("utm_source", sa.String(200)),
    ("utm_medium", sa.String(200)),
    ("utm_campaign", sa.String(200)),
    ("utm_content", sa.String(200)),
    ("utm_term", sa.String(200)),
    ("first_utm_source", sa.String(200)),
    ("first_utm_medium", sa.String(200)),
    ("first_utm_campaign", sa.String(200)),
    ("first_utm_content", sa.String(200)),
    ("first_utm_term", sa.String(200)),
    ("first_landing_page", sa.String(500)),
    ("first_referrer", sa.String(500)),
]


def upgrade() -> None:
    for name, column_type in COLUMNS:
        op.add_column("leads", sa.Column(name, column_type, nullable=True))


def downgrade() -> None:
    for name, _ in reversed(COLUMNS):
        op.drop_column("leads", name)
