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
    connection = op.get_bind()
    
    # Check if pgvector extension is already enabled
    # Only use Vector type if extension is already enabled
    # Don't try to create extension - let user install pgvector separately
    check_enabled = connection.execute(sa.text("""
        SELECT EXISTS(
            SELECT 1 FROM pg_extension WHERE extname = 'vector'
        )
    """))
    extension_enabled = check_enabled.scalar()
    
    # Add embedding column to document_chunks if it doesn't exist
    # Check if column exists first
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='document_chunks' AND column_name='embedding'
    """))
    
    if result.fetchone() is None:
        if extension_enabled:
            # Use Vector type if extension is already enabled
            op.add_column('document_chunks', sa.Column('embedding', Vector(1536), nullable=True))
        else:
            # Use BYTEA as fallback if extension is not enabled
            # Note: Vector operations won't work, but the column will exist
            # User needs to install pgvector and enable extension manually
            op.add_column('document_chunks', sa.Column('embedding', sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    # Remove embedding column
    op.drop_column('document_chunks', 'embedding')
    
    # Drop pgvector extension (be careful - this will fail if other tables use it)
    # op.execute("DROP EXTENSION IF EXISTS vector")
