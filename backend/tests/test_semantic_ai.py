"""
test_semantic_ai.py - Comprehensive Unit & Integration Tests for:
1. BGE-Small dense semantic embeddings (fastembed ONNX) vs lexical synonym failure.
2. Calibrated duplicate detection thresholds (0.78 duplicate, 0.65 related, rejecting boilerplate stopwords).
3. Persistent disk storage of vector indices (.npy + .json) surviving server restarts.
4. Zero-shot statutory bureau classification (APPR, FIN, STU, FDC) with priority detection.
"""

import os
import shutil
import tempfile
from pathlib import Path
import pytest
import numpy as np
from backend.app.services.vector_store import (
    PersistentVectorStore,
    CALIBRATED_DUPLICATE_THRESHOLD,
    CALIBRATED_RELATED_THRESHOLD,
)
from backend.app.services.triage_classifier import semantic_triage_classifier


@pytest.fixture
def temp_vector_dir():
    """Provides an isolated directory for vector store persistence testing."""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)


def test_semantic_vs_lexical_synonym_matching():
    """
    Critique 2 Validation:
    'the college stole my money' vs 'unauthorized fee extortion'.
    Under TF-IDF, these share ZERO words, scoring 0.0.
    Under BGE-small dense semantic embeddings, they must match with similarity > 0.55.
    """
    temp_dir = Path(tempfile.mkdtemp())
    try:
        store = PersistentVectorStore(storage_dir=temp_dir)
        
        phrase_a = "the college stole my money"
        phrase_b = "unauthorized fee extortion"
        unrelated_phrase = "students ragging junior in hostel corridor at night"

        vec_a = store.embed(phrase_a)
        vec_b = store.embed(phrase_b)
        vec_unrelated = store.embed(unrelated_phrase)

        # Cosine similarity between normalized vectors = dot product
        sim_synonym = float(np.dot(vec_a, vec_b))
        sim_unrelated = float(np.dot(vec_a, vec_unrelated))

        print(f"\n[Semantic Test] Synonym similarity: {sim_synonym:.4f}, Unrelated similarity: {sim_unrelated:.4f}")
        assert sim_synonym > 0.55, f"Expected semantic synonym similarity > 0.55, got {sim_synonym}"
        assert sim_synonym > sim_unrelated + 0.15, "Synonyms must score significantly higher than unrelated topics"
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_boilerplate_stopword_false_positive_resistance():
    """
    Critique 3 Validation:
    Two complaints sharing generic institutional filler ('college', 'AICTE', 'grievance', 'sir')
    should NOT trigger duplicate thresholds if their actual subjects are distinct.
    """
    temp_dir = Path(tempfile.mkdtemp())
    try:
        store = PersistentVectorStore(storage_dir=temp_dir)
        
        text_1 = "Respected AICTE grievance authority, my complaint regarding college faculty salary payment delays."
        text_2 = "AICTE institution grievance, complaint regarding unapproved civil engineering branch."

        vec_1 = store.embed(text_1)
        vec_2 = store.embed(text_2)

        sim = float(np.dot(vec_1, vec_2))
        print(f"\n[Boilerplate Test] Cross-topic filler similarity: {sim:.4f}")
        # Must NOT cross calibrated duplicate threshold
        assert sim < CALIBRATED_DUPLICATE_THRESHOLD, (
            f"Generic institutional text triggered duplicate threshold! Score: {sim:.4f}"
        )
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_vector_store_persistence_across_restarts(temp_vector_dir):
    """
    Critique 1 Validation:
    Vector store must persist embeddings to disk and reload on startup without data loss.
    """
    # 1. Instance A writes 2 cases
    store_a = PersistentVectorStore(storage_dir=temp_vector_dir)
    store_a.upsert_case(
        case_id=101,
        case_reference_id="AICTE-2026-TEST1",
        subject="Extortion of capitation fees",
        description="College demanded 2 lakhs in cash without receipt",
        institution_id=5,
        institution_name="Test Engineering Academy",
    )
    store_a.upsert_case(
        case_id=102,
        case_reference_id="AICTE-2026-TEST2",
        subject="Physical ragging incident",
        description="Juniors forced to perform humiliating acts in hostel",
        institution_id=5,
        institution_name="Test Engineering Academy",
    )
    assert store_a.count() == 2

    # 2. Simulate server restart: Instantiate completely fresh store pointing to same directory
    store_b = PersistentVectorStore(storage_dir=temp_vector_dir)
    assert store_b.count() == 2, "Reloaded store did not restore 2 persisted cases from disk"

    # 3. Query the reloaded store for duplicate of fee extortion
    results = store_b.search_duplicates(
        query_text="the college stole my money during admission fee extortion",
        threshold=0.50,
        exclude_case_id=999,
    )
    assert len(results) > 0
    top_match = results[0]
    assert top_match["case_reference_id"] == "AICTE-2026-TEST1"
    assert top_match["similarity_score"] > 0.55


def test_semantic_zero_shot_statutory_triage():
    """
    Critique 4 Validation:
    Evaluate zero-shot semantic bureau classifier against statutory archetypes:
    - APPR: Approval & unapproved courses
    - FIN: Capitation fee, extortion, financial irregularity
    - STU: Ragging, student welfare, harassment
    - FDC: Faculty salary, 7th pay commission, staff exploitation
    """
    # Case 1: Capitation fee extortion -> Should route to FIN
    res_fin = semantic_triage_classifier.classify_text(
        subject="Unauthorized donation demand",
        description="The institute is demanding 5 lakh rupees capitation fee in cash before issuing hall tickets.",
    )
    assert res_fin["bureau_code"] == "FIN", f"Expected FIN, got {res_fin['bureau_code']}"
    assert res_fin["similarity_score"] > 0.40

    # Case 2: Ragging & safety threat -> Should route to STU with URGENT priority
    res_stu = semantic_triage_classifier.classify_text(
        subject="Brutal ragging and suicide threat",
        description="Seniors beat up 1st year students in the hostel and threatened suicide. Life threatening condition.",
    )
    assert res_stu["bureau_code"] == "STU", f"Expected STU, got {res_stu['bureau_code']}"
    assert res_stu["priority"] == "URGENT", f"Expected URGENT priority for suicide/ragging threat, got {res_stu['priority']}"

    # Case 3: Fake unapproved campus -> Should route to APPR
    res_appr = semantic_triage_classifier.classify_text(
        subject="Unapproved B.Tech Computer Science Course",
        description="The college is admitting 120 students in AI branch without AICTE approval or affiliation.",
    )
    assert res_appr["bureau_code"] == "APPR", f"Expected APPR, got {res_appr['bureau_code']}"

    # Case 4: Faculty unpaid salary -> Should route to FDC
    res_fdc = semantic_triage_classifier.classify_text(
        subject="Faculty salary not paid for 8 months",
        description="Assistant professors have not received 7th CPC scale salary and Provident Fund is withheld.",
    )
    assert res_fdc["bureau_code"] == "FDC", f"Expected FDC, got {res_fdc['bureau_code']}"
