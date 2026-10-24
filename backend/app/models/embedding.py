"""
Case Embedding Model — Supabase pgvector Extension.

Replaces ephemeral local disk .npy files with Supabase's native pgvector extension.
Persists 384-dimensional dense semantic vectors (from BAAI/bge-small-en-v1.5)
directly in PostgreSQL/Supabase, preventing data loss on ephemeral cloud deploys
(Render, Heroku, AWS ECS, Fly.io).
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Index
from pgvector.sqlalchemy import Vector
from backend.app.core.database import Base


class CaseEmbedding(Base):
    __tablename__ = "case_embeddings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_reference_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # 384-dimensional dense semantic vector from BAAI/bge-small-en-v1.5
    embedding = Column(Vector(384), nullable=False)

    # Denormalized metadata for zero-join ultra-fast semantic retrieval
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    institution_aicte_id = Column(String(50), nullable=True, index=True)
    institution_name = Column(String(200), nullable=True)
    bureau_code = Column(String(20), nullable=True, index=True)
    bureau_name = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_case_embeddings_ref", "case_reference_id", unique=True),
    )
