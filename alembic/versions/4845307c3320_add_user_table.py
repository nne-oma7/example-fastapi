"""add user table

Revision ID: 4845307c3320
Revises: b479209284cd
Create Date: 2026-09-16 10:54:31.985972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4845307c3320'
down_revision: Union[str, Sequence[str], None] = 'b479209284cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('email', sa.String(), nullable=False),
                    sa.Column('password', sa.String(), nullable=False),
                    sa.Column('created_at', sa.TIMESTAMP(timezone=False), 
                              server_default=sa.text('now()'), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('email')
                    )
    """Upgrade schema."""
    pass


def downgrade() -> None:
    op.drop_table('users')
    """Downgrade schema."""
    pass
