"""notifications_quizlet_session

Revision ID: 7c4e2b9a1d63
Revises: 3a1d5f7c2e91
Create Date: 2026-10-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "7c4e2b9a1d63"
down_revision: Union[str, None] = "3a1d5f7c2e91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FK_NAME = "fk_notifications_student_to_teacher_quizlet_session_id"


def upgrade() -> None:
    op.add_column("notifications_student_to_teacher", sa.Column("quizlet_session_id", sa.Integer(), nullable=True))
    op.create_foreign_key(FK_NAME, "notifications_student_to_teacher", "quizlet_sessions", ["quizlet_session_id"],
                          ["id"])


def downgrade() -> None:
    op.drop_constraint(FK_NAME, "notifications_student_to_teacher", type_="foreignkey")
    op.drop_column("notifications_student_to_teacher", "quizlet_session_id")
