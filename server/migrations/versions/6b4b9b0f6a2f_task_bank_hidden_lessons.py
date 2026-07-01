"""task_bank_hidden_lessons

Revision ID: 6b4b9b0f6a2f
Revises: f0d7b1f05f33
Create Date: 2026-07-01 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6b4b9b0f6a2f"
down_revision: Union[str, None] = "f0d7b1f05f33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_bank_hidden_lessons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lesson_id"),
    )


def downgrade() -> None:
    op.drop_table("task_bank_hidden_lessons")