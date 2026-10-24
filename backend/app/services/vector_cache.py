"""
Vector Index Cache Engine - Production Persistent Semantic Vector Store Integration.

Delegates directly to PersistentVectorStore:
- Dense 384-d semantic embeddings (fastembed BAAI/bge-small-en-v1.5)
- Disk persistence across server restarts (<10ms reload)
- Calibrated similarity thresholds (0.78 for duplicate, 0.65 for related)
- Domain stopword stripping to prevent generic false positives
"""

from typing import Optional
from sqlalchemy.orm import Session

from backend.app.models.case import ComplaintCase
from backend.app.schemas.ai import (
    DuplicateCheckRequest,
    DuplicateCheckResponse,
)
from backend.app.services.vector_store import persistent_vector_store, PersistentVectorStore


class VectorIndexCache:
    """Singleton proxy routing queries to PersistentVectorStore with full semantic dense capabilities."""

    _instance: Optional["VectorIndexCache"] = None

    def __init__(self):
        self.store: PersistentVectorStore = persistent_vector_store

    @classmethod
    def get_instance(cls) -> "VectorIndexCache":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def is_initialized(self) -> bool:
        return self.store.is_initialized

    def initialize_index(self, db: Session, max_features: int = 5000):
        """Loads precomputed vectors from disk in <10ms or embeds and saves if missing."""
        self.store.load_or_build(db)

    def add_case(self, case: ComplaintCase):
        """Incrementally embeds and persists new complaint record in ~15ms."""
        self.store.add_case(case)

    def query_similarity(
        self,
        db: Session,
        request: DuplicateCheckRequest,
    ) -> DuplicateCheckResponse:
        """Executes calibrated dense semantic cosine search across persistent vector corpus."""
        return self.store.query_similarity(db, request)


# Global singleton instance maintaining backward compatibility
vector_index = VectorIndexCache.get_instance()
