"""quizlet_assignment_target_subgroups

Revision ID: aa12c4e5f901
Revises: f4d22a91b671
Create Date: 2026-05-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "aa12c4e5f901"
down_revision: Union[str, None] = "f4d22a91b671"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quizlet_assignment_target_subgroups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        sa.Column("subgroup_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["subgroup_id"], ["user_quizlet_subgroups.id"]),
        sa.ForeignKeyConstraint(["target_id"], ["quizlet_assignment_targets.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("target_id", "subgroup_id", name="idx_quizlet_assignment_target_subgroup"),
    )


def downgrade() -> None:
    op.drop_table("quizlet_assignment_target_subgroups")
