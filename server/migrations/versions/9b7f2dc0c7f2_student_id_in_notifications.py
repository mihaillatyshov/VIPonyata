"""student_id_in_notifications

Revision ID: 9b7f2dc0c7f2
Revises: d21b95be8798
Create Date: 2023-11-27 20:34:55.483629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b7f2dc0c7f2'
down_revision: Union[str, None] = 'd21b95be8798'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('notifications_teacher_to_student', sa.Column('student_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'notifications_teacher_to_student', 'users', ['student_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'notifications_teacher_to_student', type_='foreignkey')
    op.drop_column('notifications_teacher_to_student', 'student_id')
    # ### end Alembic commands ###