"""add content column to posts table

Revision ID: b479209284cd
Revises: ae4d2cfbaa78
Create Date: 2026-09-16 10:40:34.772538

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b479209284cd'
down_revision: Union[str, Sequence[str], None] = 'ae4d2cfbaa78'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('posts', sa.Column('content', sa.String(), nullable=False))
    """Upgrade schema."""
    pass


def downgrade() -> None:
    op.drop_column('posts', 'content')
    """Downgrade schema."""
    pass
