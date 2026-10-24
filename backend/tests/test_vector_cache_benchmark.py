"""
Benchmark test evaluating throughput and latency of the VectorIndexCache
simulating high-concurrency duplicate checks.
"""

import time
import pytest
from backend.app.core.database import SessionLocal
from backend.app.services.vector_cache import vector_index
from backend.app.schemas.ai import DuplicateCheckRequest


def test_vector_index_latency_benchmark():
    db = SessionLocal()
    try:
        # Ensure index is initialized
        if not vector_index.is_initialized:
            vector_index.initialize_index(db)

        test_query = DuplicateCheckRequest(
            subject="Harassment and ragging in university hostel premises by seniors",
            description="First year students were subjected to physical abuse and threats by senior students late at night in block B.",
            threshold=0.35,
        )

        # Warmup
        _ = vector_index.query_similarity(db, test_query)

        # Benchmark 50 consecutive queries
        iterations = 50
        start_time = time.perf_counter()
        for _ in range(iterations):
            resp = vector_index.query_similarity(db, test_query)
            assert resp.total_evaluated > 0

        elapsed = time.perf_counter() - start_time
        avg_ms_per_query = (elapsed / iterations) * 1000.0

        print(f"\n[BENCHMARK RESULT] Vector Index Latency: {avg_ms_per_query:.3f} ms per query across {iterations} iterations.")
        # AI-SPEC target: < 35 ms
        assert avg_ms_per_query < 35.0, f"Query took {avg_ms_per_query} ms, exceeding 35ms target"
    finally:
        db.close()
