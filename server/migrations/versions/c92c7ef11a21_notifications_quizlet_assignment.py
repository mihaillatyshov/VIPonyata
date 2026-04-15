"""notifications_quizlet_assignment

Revision ID: c92c7ef11a21
Revises: 7c4f9e2ab3d1
Create Date: 2026-04-15 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c92c7ef11a21"
down_revision: Union[str, None] = "7c4f9e2ab3d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notifications_teacher_to_student", sa.Column("quizlet_assignment_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "notifications_teacher_to_student", "quizlet_assignments", ["quizlet_assignment_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint(None, "notifications_teacher_to_student", type_="foreignkey")
    op.drop_column("notifications_teacher_to_student", "quizlet_assignment_id")
