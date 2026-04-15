"""quizlet_assignments

Revision ID: 7c4f9e2ab3d1
Revises: 2f3c1d9a4b8e
Create Date: 2026-04-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c4f9e2ab3d1"
down_revision: Union[str, None] = "2f3c1d9a4b8e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quizlet_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("quiz_type", sa.String(length=32), nullable=False),
        sa.Column("show_hints", sa.Boolean(), nullable=False),
        sa.Column("translation_direction", sa.String(length=32), nullable=False),
        sa.Column("max_words", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "quizlet_assignment_subgroups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("subgroup_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["quizlet_assignments.id"]),
        sa.ForeignKeyConstraint(["subgroup_id"], ["quizlet_subgroups.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", "subgroup_id", name="idx_quizlet_assignment_subgroup"),
    )

    op.create_table(
        "quizlet_assignment_targets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["assignment_id"], ["quizlet_assignments.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", "student_id", name="idx_quizlet_assignment_target"),
    )

    op.add_column("quizlet_sessions", sa.Column("assignment_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        None,
        "quizlet_sessions",
        "quizlet_assignments",
        ["assignment_id"],
        ["id"],
    )

    op.create_table(
        "quizlet_assignment_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("total_words", sa.Integer(), nullable=False),
        sa.Column("correct_answers", sa.Integer(), nullable=False),
        sa.Column("incorrect_answers", sa.Integer(), nullable=False),
        sa.Column("skipped_words", sa.Integer(), nullable=False),
        sa.Column("elapsed_seconds", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["quizlet_assignments.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["quizlet_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", "student_id", name="idx_quizlet_assignment_result"),
        sa.UniqueConstraint("session_id"),
    )

    op.add_column(
        "notifications_student_to_teacher",
        sa.Column("quizlet_assignment_result_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        None,
        "notifications_student_to_teacher",
        "quizlet_assignment_results",
        ["quizlet_assignment_result_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(None, "notifications_student_to_teacher", type_="foreignkey")
    op.drop_column("notifications_student_to_teacher", "quizlet_assignment_result_id")

    op.drop_table("quizlet_assignment_results")

    op.drop_constraint(None, "quizlet_sessions", type_="foreignkey")
    op.drop_column("quizlet_sessions", "assignment_id")

    op.drop_table("quizlet_assignment_targets")
    op.drop_table("quizlet_assignment_subgroups")
    op.drop_table("quizlet_assignments")
