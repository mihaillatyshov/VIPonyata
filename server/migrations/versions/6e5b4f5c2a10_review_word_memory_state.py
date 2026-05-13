"""review_word_memory_state

Revision ID: 6e5b4f5c2a10
Revises: aa12c4e5f901
Create Date: 2026-05-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "6e5b4f5c2a10"
down_revision: Union[str, None] = "aa12c4e5f901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("review_words", sa.Column("status", sa.String(length=32), nullable=False, server_default="passive"))
    op.add_column("review_words", sa.Column("stage", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("review_words", sa.Column("is_frozen", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("review_words", "is_frozen")
    op.drop_column("review_words", "stage")
    op.drop_column("review_words", "status")
