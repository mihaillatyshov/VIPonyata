"""task_bank_items_hidden_flag

Revision ID: 9b72b8d41a10
Revises: e13f2a7c9d44
Create Date: 2026-07-01 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "9b72b8d41a10"
down_revision: Union[str, None] = "e13f2a7c9d44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "task_bank_items",
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("task_bank_items", "is_hidden")
