"""quizlet_session_subgroup_ids

Revision ID: b3e7a1d4c982
Revises: 6e5b4f5c2a10
Create Date: 2026-05-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b3e7a1d4c982"
down_revision: Union[str, None] = "6e5b4f5c2a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("quizlet_sessions", sa.Column("subgroup_ids", sa.Text(), nullable=False, server_default="[]"))
    op.add_column("quizlet_sessions", sa.Column("user_subgroup_ids", sa.Text(), nullable=False, server_default="[]"))


def downgrade() -> None:
    op.drop_column("quizlet_sessions", "user_subgroup_ids")
    op.drop_column("quizlet_sessions", "subgroup_ids")
