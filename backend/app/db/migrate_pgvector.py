"""
Database migration: Enable pgvector extension and create case_embeddings table.

Ensures that Supabase/PostgreSQL has the 'vector' extension enabled and creates
the case_embeddings table with native Vector(384) column type.
"""

from sqlalchemy import text
from backend.app.core.database import Base, engine
from backend.app.models.embedding import CaseEmbedding


def migrate_pgvector():
    """
    Enables pgvector extension on PostgreSQL/Supabase and creates case_embeddings table.
    Gracefully handles SQLite in local/test environments.
    """
    print("[Migration] Ensuring pgvector extension and case_embeddings table exist...")
    try:
        # If running on PostgreSQL/Supabase, enable the pgvector extension first
        if engine.dialect.name == "postgresql":
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            print("[Migration] [OK] PostgreSQL pgvector extension enabled.")

        # Create case_embeddings table
        Base.metadata.create_all(
            bind=engine,
            tables=[CaseEmbedding.__table__],
            checkfirst=True,
        )
        print("[Migration] [OK] case_embeddings table verified/created.")

        # If PostgreSQL, create an HNSW index for sub-millisecond cosine distance lookups
        if engine.dialect.name == "postgresql":
            with engine.connect() as conn:
                try:
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_case_embeddings_hnsw_cosine
                        ON case_embeddings USING hnsw (embedding vector_cosine_ops);
                    """))
                    conn.commit()
                    print("[Migration] [OK] HNSW cosine vector index verified on PostgreSQL.")
                except Exception as index_err:
                    print(f"[Migration] Note: HNSW index creation skipped or deferred: {index_err}")
    except Exception as e:
        print(f"[Migration] Warning during pgvector migration: {e}")
        raise


if __name__ == "__main__":
    migrate_pgvector()
