"""task_bank_items_customized_flag

Revision ID: 1c8df7f72c44
Revises: 6b4b9b0f6a2f
Create Date: 2026-07-01 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "1c8df7f72c44"
down_revision: Union[str, None] = "6b4b9b0f6a2f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "task_bank_items",
        sa.Column("is_customized", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("task_bank_items", "is_customized")
