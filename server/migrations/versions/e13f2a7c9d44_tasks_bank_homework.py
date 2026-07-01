"""tasks_bank_homework

Revision ID: e13f2a7c9d44
Revises: b3e7a1d4c982
Create Date: 2026-07-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e13f2a7c9d44"
down_revision: Union[str, None] = "b3e7a1d4c982"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_bank_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("sort", sa.Integer(), nullable=False),
        sa.Column("task_name", sa.String(length=64), nullable=False),
        sa.Column("task_json", sa.Text(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=True),
        sa.Column("source_assessment_id", sa.Integer(), nullable=True),
        sa.Column("source_task_index", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.ForeignKeyConstraint(["source_assessment_id"], ["assessments.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_assessment_id", "source_task_index", name="idx_task_bank_source_task"),
    )

    op.create_table(
        "homework_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "homework_assignment_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("task_bank_item_id", sa.Integer(), nullable=True),
        sa.Column("lesson_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("task_name", sa.String(length=64), nullable=False),
        sa.Column("task_json", sa.Text(), nullable=False),
        sa.Column("sort", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["homework_assignments.id"]),
        sa.ForeignKeyConstraint(["task_bank_item_id"], ["task_bank_items.id"]),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "homework_assignment_targets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["assignment_id"], ["homework_assignments.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", "student_id", name="idx_homework_assignment_target"),
    )

    op.create_table(
        "homework_tries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("start_datetime", sa.DateTime(), nullable=False),
        sa.Column("end_datetime", sa.DateTime(), nullable=True),
        sa.Column("done_tasks", sa.Text(), nullable=False),
        sa.Column("checked_tasks", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["homework_assignments.id"]),
        sa.ForeignKeyConstraint(["target_id"], ["homework_assignment_targets.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("target_id", name="idx_homework_try_target"),
    )

    op.add_column("notifications_teacher_to_student", sa.Column("homework_assignment_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "notifications_teacher_to_student", "homework_assignments", ["homework_assignment_id"],
                          ["id"])

    op.add_column("notifications_student_to_teacher", sa.Column("homework_try_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "notifications_student_to_teacher", "homework_tries", ["homework_try_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint(None, "notifications_student_to_teacher", type_="foreignkey")
    op.drop_column("notifications_student_to_teacher", "homework_try_id")

    op.drop_constraint(None, "notifications_teacher_to_student", type_="foreignkey")
    op.drop_column("notifications_teacher_to_student", "homework_assignment_id")

    op.drop_table("homework_tries")
    op.drop_table("homework_assignment_targets")
    op.drop_table("homework_assignment_tasks")
    op.drop_table("homework_assignments")
    op.drop_table("task_bank_items")
