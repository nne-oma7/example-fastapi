"""add last few columns to posts table

Revision ID: 4a193622ea61
Revises: 9bd362a8da94
Create Date: 2026-09-16 15:15:11.486835

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a193622ea61'
down_revision: Union[str, Sequence[str], None] = '9bd362a8da94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('posts', sa.Column(
      'published', sa.Boolean(), nullable=False, server_default='True'),) 
    op.add_column('posts', sa.Column(
          'created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text
          ('NOW()')),) 
    """Upgrade schema."""
    pass


def downgrade() -> None:
    op.drop_column('posts', 'published')
    op.drop_column('posts', 'created_at')
    """Downgrade schema."""
    pass
