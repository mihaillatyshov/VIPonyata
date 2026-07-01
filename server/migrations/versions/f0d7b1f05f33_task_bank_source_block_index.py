"""task_bank_source_block_index

Revision ID: f0d7b1f05f33
Revises: 9b72b8d41a10
Create Date: 2026-07-01 19:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f0d7b1f05f33"
down_revision: Union[str, None] = "9b72b8d41a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("task_bank_items", sa.Column("source_block_index", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("task_bank_items", "source_block_index")
