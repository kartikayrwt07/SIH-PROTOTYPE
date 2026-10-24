"""
Unit and API integration tests for Explainable AI Intelligence,
TF-IDF Duplicate Detection, and Human-in-the-Loop Triage Recommendation.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.case import ComplaintCase, CaseStatus, CasePriority
from backend.app.models.audit import CaseAuditEvent
from backend.app.schemas.ai import (
    DuplicateCheckRequest,
    TriageSuggestRequest,
    TriageApplyRequest,
)
from backend.app.services.ai_intelligence import (
    check_duplicate_complaints,
    compute_triage_suggestion,
    apply_triage_suggestion,
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


def test_duplicate_detection_high_similarity(db: Session):
    """Verifies that an incoming complaint nearly identical to an existing case scores >= 0.70."""
    # Find or verify an active case exists
    existing = db.query(ComplaintCase).first()
    assert existing is not None

    req = DuplicateCheckRequest(
        subject=existing.subject,
        description=existing.description_confidential or existing.description_redacted or "",
        institution_aicte_id=existing.institution.aicte_permanent_id if existing.institution else None,
        threshold=0.50
    )

    response = check_duplicate_complaints(db, req)
    assert response.total_evaluated > 0
    assert response.matches_found >= 1
    assert response.highest_similarity >= 0.70
    assert response.has_potential_duplicate is True
    
    top_match = response.matches[0]
    assert top_match.case_reference_id == existing.case_reference_id
    assert len(top_match.matched_keywords) > 0


def test_duplicate_detection_unrelated_yields_low_score(db: Session):
    """Verifies that an arbitrary unrelated text yields no false positive duplicates above calibrated 0.65 threshold."""
    req = DuplicateCheckRequest(
        subject="Completely unrelated astronomy observation",
        description="The telescope observed distant celestial bodies with no relation to AICTE academic grievances.",
        threshold=0.65
    )
    response = check_duplicate_complaints(db, req)
    assert response.matches_found == 0
    assert response.has_potential_duplicate is False
    assert response.highest_similarity < 0.65


def test_triage_suggestion_ragging(db: Session):
    """Verifies ragging complaint routes to STU (Student Welfare Cell) with URGENT priority and semantic rationales."""
    req = TriageSuggestRequest(
        subject="Senior students hostel harassment and ragging incident",
        description="Hostel seniors forced first year students into late night physical humiliation. Hostel warden took zero preventive action.",
    )
    suggestion = compute_triage_suggestion(db, req)
    
    assert suggestion.recommended_bureau_code == "STU"
    assert suggestion.recommended_category == "Ragging Allegation"
    assert suggestion.recommended_priority == "URGENT"
    assert suggestion.confidence_score >= 0.70
    
    # Check explainability rationale
    assert len(suggestion.rationales) >= 2
    affinity_factor = next((r for r in suggestion.rationales if r.category in ["KEYWORD_AFFINITY", "SEMANTIC_AFFINITY"]), None)
    assert affinity_factor is not None


def test_triage_suggestion_fee_irregularity(db: Session):
    """Verifies fee grievance routes to FIN (Finance Bureau) with explainability breakdown."""
    req = TriageSuggestRequest(
        subject="Mandatory building fund donation surcharge",
        description="College administration is withholding original documents and demanding INR 50,000 capitation fee without valid receipt.",
    )
    suggestion = compute_triage_suggestion(db, req)
    
    assert suggestion.recommended_bureau_code == "FIN"
    assert suggestion.recommended_category == "Fee & Financial Irregularities"
    assert suggestion.confidence_score >= 0.70
    
    policy_factor = next((r for r in suggestion.rationales if r.category == "DOMAIN_POLICY"), None)
    assert policy_factor is not None


def test_human_in_the_loop_apply_service(db: Session):
    """Verifies Human-in-the-Loop apply updates the case and creates an audit record."""
    bureau = db.query(Bureau).filter(Bureau.code == "APPR").first()
    assert bureau is not None
    institution = db.query(Institution).first()
    assert institution is not None
    
    test_case = ComplaintCase(
        case_reference_id=f"CASE-TEST-AI-{int(datetime.utcnow().timestamp())}",
        subject="Temporary Test Case for AI Triage",
        description_redacted="Testing human in the loop application of bureau routing recommendation.",
        description_confidential="Testing human in the loop application of bureau routing recommendation.",
        bureau_id=bureau.id,
        institution_id=institution.id,
        category="General Grievance",
        priority=CasePriority.LOW,
        status=CaseStatus.RECEIVED,
        due_date=datetime.utcnow() + timedelta(days=14),
    )
    db.add(test_case)
    db.commit()
    db.refresh(test_case)

    stu_bureau = db.query(Bureau).filter(Bureau.code == "STU").first()
    assert stu_bureau is not None

    apply_req = TriageApplyRequest(
        case_reference_id=test_case.case_reference_id,
        bureau_id=stu_bureau.id,
        category="Ragging Allegation",
        priority="URGENT",
        justification="Verified by Central Grievance Review Committee"
    )

    result = apply_triage_suggestion(db, apply_req, actor_email="supervisor@aicte-demo.gov.in")
    
    assert result.bureau_code == "STU"
    assert result.category == "Ragging Allegation"
    assert result.priority == "URGENT"
    assert result.status == "Assigned"

    # Verify audit event
    audit = db.query(CaseAuditEvent).filter(CaseAuditEvent.id == result.audit_event_id).first()
    assert audit is not None
    assert audit.metadata_json["actor_email"] == "supervisor@aicte-demo.gov.in"
    assert "Verified by Central Grievance Review Committee" in audit.metadata_json["justification"]

    # Cleanup test case
    db.delete(audit)
    db.delete(test_case)
    db.commit()


def test_ai_api_endpoints(client: TestClient, db: Session):
    """Verifies all Phase 8 REST endpoints operate smoothly with authentication."""
    headers = {"X-User-Role": "SUPERVISOR", "X-User-Email": "supervisor@aicte-demo.gov.in"}

    # 1. POST /api/v1/ai/duplicates/check
    dup_res = client.post(
        "/api/v1/ai/duplicates/check",
        json={
            "subject": "Ragging in hostel rooms",
            "description": "First year students threatened with physical violence by seniors in hostel block A.",
            "threshold": 0.30
        },
        headers=headers,
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["success"] is True
    assert "matches_found" in dup_data["data"]

    # 2. GET /api/v1/ai/duplicates/{case_ref}
    sample_case = db.query(ComplaintCase).first()
    assert sample_case is not None

    case_dup_res = client.get(
        f"/api/v1/ai/duplicates/{sample_case.case_reference_id}?threshold=0.20",
        headers=headers,
    )
    assert case_dup_res.status_code == 200
    assert case_dup_res.json()["success"] is True

    # 3. POST /api/v1/ai/triage/suggest
    triage_res = client.post(
        "/api/v1/ai/triage/suggest",
        json={
            "subject": "Delayed exam results and missing lab equipment",
            "description": "Computer science department lacks working computers and syllabus remains incomplete before semester examination."
        },
        headers=headers,
    )
    assert triage_res.status_code == 200
    triage_data = triage_res.json()
    assert triage_data["success"] is True
    assert triage_data["data"]["recommended_bureau_code"] in ["APPR", "FDC"]
    assert len(triage_data["data"]["rationales"]) > 0

    # 4. GET /api/v1/ai/triage/suggest/{case_ref}
    case_triage_res = client.get(
        f"/api/v1/ai/triage/suggest/{sample_case.case_reference_id}",
        headers=headers,
    )
    assert case_triage_res.status_code == 200
    assert case_triage_res.json()["success"] is True
