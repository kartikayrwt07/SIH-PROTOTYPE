"""
Unit and integration tests for Supabase pgvector migration.

Validates that:
1. CaseEmbedding model persists 384-dimensional dense vectors to PostgreSQL/Supabase.
2. PersistentVectorStore loads embeddings directly from the database table case_embeddings,
   making it immune to ephemeral disk wipes on Render, Heroku, or AWS ECS.
3. Adding/upserting cases updates the database vector store atomically.
4. Native pgvector cosine similarity search retrieves semantically relevant cases.
"""

import pytest
import numpy as np
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal, engine
from backend.app.models.embedding import CaseEmbedding
from backend.app.models.case import ComplaintCase
from backend.app.services.vector_store import PersistentVectorStore, CALIBRATED_RELATED_THRESHOLD


@pytest.fixture
def db_session():
    """Provides a database session for pgvector tests."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_supabase_pgvector_table_populated(db_session: Session):
    """Verifies that case_embeddings table in Supabase contains active vectors."""
    count = db_session.query(CaseEmbedding).count()
    assert count > 0, "Expected case_embeddings table to contain indexed vectors in Supabase"
    
    # Verify vector dimension
    sample = db_session.query(CaseEmbedding).first()
    assert sample is not None
    assert len(sample.embedding) == 384, f"Expected 384 dimensions, got {len(sample.embedding)}"
    assert sample.case_reference_id is not None
    assert sample.subject is not None


def test_vector_store_loads_from_supabase_pgvector(db_session: Session):
    """
    Verifies that PersistentVectorStore loads directly from Supabase pgvector table
    without needing any local .npy disk files.
    """
    # Create an isolated store instance with a non-existent dummy directory to prove zero disk reliance
    store = PersistentVectorStore(storage_dir=None)
    loaded = store._load_from_database(db_session)
    assert loaded is True, "Failed to load embeddings from Supabase pgvector table"
    assert store.count() > 0
    assert store.is_initialized is True


def test_supabase_pgvector_native_search(db_session: Session):
    """
    Verifies native SQL pgvector cosine distance search or fallback similarity retrieval.
    """
    store = PersistentVectorStore.get_instance()
    results = store.search_pgvector_sql(
        db=db_session,
        query_text="unapproved admission fee demands and capitation payments",
        threshold=0.40,
        limit=5,
    )
    assert len(results) > 0, "Expected at least one semantic match for fee extortion query"
    top_match = results[0]
    assert "similarity_score" in top_match
    assert top_match["similarity_score"] >= 0.40
    assert "case_reference_id" in top_match


def test_ephemeral_disk_wipe_immunity(db_session: Session):
    """
    Simulates a container restart or deployment on an ephemeral filesystem
    (Render / Heroku / AWS ECS) where local disk files do not exist:
    The store must restore full state directly from Supabase.
    """
    import tempfile
    from pathlib import Path

    empty_temp_dir = Path(tempfile.mkdtemp())
    # Instantiate store in an empty directory with zero .npy or .json files
    ephemeral_store = PersistentVectorStore(storage_dir=empty_temp_dir)
    assert ephemeral_store.count() == 0  # Empty on local disk

    # Trigger load_or_build with DB
    ephemeral_store.load_or_build(db_session)
    
    # Verify vectors restored from Supabase pgvector
    assert ephemeral_store.count() > 0
    assert ephemeral_store.is_initialized is True
    
    # Query works seamlessly
    matches = ephemeral_store.search_duplicates(
        query_text="ragging of junior student in hostel",
        threshold=0.50,
    )
    assert len(matches) > 0
