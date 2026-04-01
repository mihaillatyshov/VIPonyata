"""quizlet_tables

Revision ID: 2f3c1d9a4b8e
Revises: 9b7f2dc0c7f2
Create Date: 2026-04-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2f3c1d9a4b8e'
down_revision: Union[str, None] = '9b7f2dc0c7f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('quizlet_groups', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('title', sa.String(length=128), nullable=False),
                    sa.Column('sort', sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.PrimaryKeyConstraint('id'))

    op.create_table('quizlet_dictionary', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('char_jp', sa.String(length=128), nullable=True),
                    sa.Column('word_jp', sa.String(length=128), nullable=False),
                    sa.Column('ru', sa.String(length=128), nullable=False),
                    sa.Column('img', sa.String(length=1024), nullable=True),
                    sa.Column('owner_id', sa.Integer(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['owner_id'],
                        ['users.id'],
                    ), sa.PrimaryKeyConstraint('id'))

    op.create_table('quizlet_subgroups', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('title', sa.String(length=128), nullable=False),
                    sa.Column('sort', sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.Column('group_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['group_id'],
                        ['quizlet_groups.id'],
                    ), sa.PrimaryKeyConstraint('id'))

    op.create_table('quizlet_subgroup_words', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('subgroup_id', sa.Integer(), nullable=False),
                    sa.Column('word_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['subgroup_id'],
                        ['quizlet_subgroups.id'],
                    ), sa.ForeignKeyConstraint(
                        ['word_id'],
                        ['quizlet_dictionary.id'],
                    ), sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('subgroup_id', 'word_id', name='idx_quizlet_subgroup_word'))

    op.create_table('user_quizlet_lessons', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('title', sa.String(length=128), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['user_id'],
                        ['users.id'],
                    ), sa.PrimaryKeyConstraint('id'), sa.UniqueConstraint('user_id'))

    op.create_table('user_quizlet_subgroups', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('title', sa.String(length=128), nullable=False),
                    sa.Column('sort', sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.Column('lesson_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['lesson_id'],
                        ['user_quizlet_lessons.id'],
                    ), sa.PrimaryKeyConstraint('id'))

    op.create_table('user_quizlet_words', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('char_jp', sa.String(length=128), nullable=True),
                    sa.Column('word_jp', sa.String(length=128), nullable=False),
                    sa.Column('ru', sa.String(length=128), nullable=False),
                    sa.Column('img', sa.String(length=1024), nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.Column('subgroup_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['subgroup_id'],
                        ['user_quizlet_subgroups.id'],
                    ), sa.PrimaryKeyConstraint('id'))

    op.create_table('quizlet_sessions', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('quiz_type', sa.String(length=32), nullable=False),
                    sa.Column('show_hints', sa.Boolean(), nullable=False),
                    sa.Column('translation_direction', sa.String(length=32), nullable=False),
                    sa.Column('is_finished', sa.Boolean(), nullable=False),
                    sa.Column('started_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.Column('ended_at', sa.DateTime(), nullable=True),
                    sa.Column('elapsed_seconds', sa.Integer(), nullable=False),
                    sa.Column('total_words', sa.Integer(), nullable=False),
                    sa.Column('correct_answers', sa.Integer(), nullable=False),
                    sa.Column('incorrect_answers', sa.Integer(), nullable=False),
                    sa.Column('skipped_words', sa.Integer(), nullable=False),
                    sa.Column('queue_state', sa.Text(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['user_id'],
                        ['users.id'],
                    ), sa.PrimaryKeyConstraint('id'))

    op.create_table('quizlet_session_words', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('source_type', sa.String(length=16), nullable=False),
                    sa.Column('source_word_id', sa.Integer(), nullable=False),
                    sa.Column('char_jp', sa.String(length=128), nullable=True),
                    sa.Column('word_jp', sa.String(length=128), nullable=False),
                    sa.Column('ru', sa.String(length=128), nullable=False),
                    sa.Column('img', sa.String(length=1024), nullable=True),
                    sa.Column('is_correct', sa.Boolean(), nullable=False),
                    sa.Column('is_skipped', sa.Boolean(), nullable=False),
                    sa.Column('incorrect_attempts', sa.Integer(), nullable=False),
                    sa.Column('correct_attempts', sa.Integer(), nullable=False),
                    sa.Column('session_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['session_id'],
                        ['quizlet_sessions.id'],
                    ), sa.PrimaryKeyConstraint('id'))

    op.create_table('quizlet_session_incorrect_words', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('session_id', sa.Integer(), nullable=False),
                    sa.Column('session_word_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['session_id'],
                        ['quizlet_sessions.id'],
                    ), sa.ForeignKeyConstraint(
                        ['session_word_id'],
                        ['quizlet_session_words.id'],
                    ), sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('session_id', 'session_word_id', name='idx_quizlet_session_incorrect_word'))


def downgrade() -> None:
    op.drop_table('quizlet_session_incorrect_words')
    op.drop_table('quizlet_session_words')
    op.drop_table('quizlet_sessions')
    op.drop_table('user_quizlet_words')
    op.drop_table('user_quizlet_subgroups')
    op.drop_table('user_quizlet_lessons')
    op.drop_table('quizlet_subgroup_words')
    op.drop_table('quizlet_subgroups')
    op.drop_table('quizlet_dictionary')
    op.drop_table('quizlet_groups')
