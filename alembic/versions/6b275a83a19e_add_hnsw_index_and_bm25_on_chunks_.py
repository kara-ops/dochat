"""add hnsw index and bm25 on chunks.embedding and chunks.content


Revision ID: 6b275a83a19e
Revises: f64bad4196bc
Create Date: 2026-08-20 20:34:06.891203

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b275a83a19e'
down_revision: Union[str, Sequence[str], None] = 'f64bad4196bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# def upgrade() -> None:
#     """Upgrade schema."""
#     op.execute("""CREATE INDEX chunks_bm25_index ON chunks
#     USING bm25 (id, content)
#     WITH (key_field=id,text_fields='{"content":{}}');
#     """)
#     op.execute("""CREATE INDEX chunks_hnsw_index ON chunks
#     USING hnsw (embedding vector_cosine_ops);
#     """)
#     pass


# def downgrade() -> None:
#     """Downgrade schema."""
#     op.execute("DROP INDEX IF EXISTS chunks_hnsw_index")
#     op.execute("DROP INDEX IF EXISTS chunks_bm25_index")
#     pass
