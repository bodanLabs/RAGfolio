"""Enable pgvector extension

Revision ID: enable_pgvector_001
Revises: 1242ef6cbc30
Create Date: 2026-01-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = 'enable_pgvector_001'
down_revision: Union[str, None] = '1242ef6cbc30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    
    # Add embedding column to document_chunks if it doesn't exist
    # Check if column exists first
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='document_chunks' AND column_name='embedding'
    """))
    
    if result.fetchone() is None:
        op.add_column('document_chunks', sa.Column('embedding', Vector(1536), nullable=True))


def downgrade() -> None:
    # Remove embedding column
    op.drop_column('document_chunks', 'embedding')
    
    # Drop pgvector extension (be careful - this will fail if other tables use it)
    # op.execute("DROP EXTENSION IF EXISTS vector")
