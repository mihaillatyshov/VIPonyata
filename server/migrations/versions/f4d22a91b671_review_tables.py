"""review_tables

Revision ID: f4d22a91b671
Revises: c92c7ef11a21
Create Date: 2026-04-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f4d22a91b671"
down_revision: Union[str, None] = "c92c7ef11a21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "review_dictionaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=128), nullable=False),
        sa.Column("sort", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "review_topics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=128), nullable=False),
        sa.Column("sort", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("dictionary_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["dictionary_id"], ["review_dictionaries.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "review_words",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=256), nullable=True),
        sa.Column("word_jp", sa.String(length=256), nullable=False),
        sa.Column("ru", sa.String(length=256), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("examples", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["topic_id"], ["review_topics.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("review_words")
    op.drop_table("review_topics")
    op.drop_table("review_dictionaries")
