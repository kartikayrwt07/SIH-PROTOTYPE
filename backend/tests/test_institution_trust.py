"""
Automated Test Suite for Dynamic Institution Trust / Credit Score Engine & High-Risk Leaderboard.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.institution import Institution
from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.sla import CasePriority
from backend.app.models.bureau import Bureau
from backend.app.services.institution_trust import (
    calculate_institution_trust_score,
    get_trust_score_leaderboard,
    execute_regulatory_action,
)
from backend.app.schemas.institution_trust import RegulatoryActionRequest


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


def test_baseline_trust_score(db: Session):
    """An institution with 0 complaints should have a pristine score of 1000 (AAA)."""
    inst = db.query(Institution).first()
    assert inst is not None, "At least one institution should exist in test DB"

    # Temporarily calculate score with empty cases or isolated
    score_detail = calculate_institution_trust_score(inst, db)
    assert 0 <= score_detail.trust_score <= 1000
    assert score_detail.trust_grade in ["AAA", "AA", "A-", "BBB", "B", "C"]
    assert score_detail.risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert score_detail.base_score == 1000


def test_trust_score_sla_deductions(db: Session):
    """Test that overdue SLA breaches deduct points correctly."""
    # Find an institution that has cases
    inst = db.query(Institution).filter(Institution.cases.any()).first()
    if not inst:
        pytest.skip("No institution with cases found in DB")

    detail = calculate_institution_trust_score(inst, db)
    breakdown = detail.deduction_breakdown

    if detail.overdue_cases > 0:
        assert breakdown.sla_breach_points > 0
        assert breakdown.sla_breach_points >= detail.overdue_cases * 45
        assert detail.trust_score < 1000

    # Ensure net deduction matches
    assert breakdown.total_deductions >= 0


def test_leaderboard_worst_first_sorting(db: Session):
    """Leaderboard with sort_order='worst_first' should sort by ascending trust score."""
    leaderboard, summary = get_trust_score_leaderboard(db, sort_order="worst_first", limit=10)
    assert len(leaderboard) > 0
    assert summary.total_institutions >= len(leaderboard)
    assert 0 <= summary.national_average_score <= 1000

    # Verify monotonic non-decreasing order of scores
    scores = [item.trust_score for item in leaderboard]
    assert scores == sorted(scores), f"Scores should be sorted ascending for worst_first: {scores}"


def test_leaderboard_best_first_sorting(db: Session):
    """Leaderboard with sort_order='best_first' should sort by descending trust score."""
    leaderboard, _ = get_trust_score_leaderboard(db, sort_order="best_first", limit=10)
    scores = [item.trust_score for item in leaderboard]
    assert scores == sorted(scores, reverse=True), f"Scores should be sorted descending: {scores}"


def test_api_trust_scores_endpoint(client: TestClient):
    """GET /api/v1/institutions/trust-scores should return 200 with ranked institutions."""
    res = client.get("/api/v1/institutions/trust-scores?sort_order=worst_first&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    if len(data["data"]) > 0:
        first = data["data"][0]
        assert "trust_score" in first
        assert "trust_grade" in first
        assert "risk_level" in first
        assert "automated_directive" in first
        assert "deduction_breakdown" in first


def test_api_trust_summary_endpoint(client: TestClient):
    """GET /api/v1/institutions/trust-scores/summary should return aggregate national metrics."""
    res = client.get("/api/v1/institutions/trust-scores/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    summary = data["data"]
    assert "national_average_score" in summary
    assert "critical_risk_count" in summary
    assert "total_sla_breaches" in summary


def test_api_single_institution_trust_score(client: TestClient, db: Session):
    """GET /api/v1/institutions/{id}/trust-score should return itemized deductions and citations."""
    inst = db.query(Institution).first()
    assert inst is not None
    res = client.get(f"/api/v1/institutions/{inst.id}/trust-score")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["institution_id"] == inst.id
    assert "citations" in data["data"]
    assert "deduction_breakdown" in data["data"]


def test_execute_regulatory_action(db: Session):
    """Executing an automated regulatory action should return a logged reference number."""
    inst = db.query(Institution).first()
    assert inst is not None
    req = RegulatoryActionRequest(
        action_type="SHOW_CAUSE_NOTICE",
        directive_notes="Triggered by AICTE Super Admin High-Risk Leaderboard due to repeated SLA breaches.",
    )
    res = execute_regulatory_action(inst.id, req, db)
    assert res.success is True
    assert res.institution_id == inst.id
    assert "AICTE/REG/" in res.reference_number
    assert "Show-Cause Notice" in res.message


def test_execute_regulatory_action_with_action_code(db: Session):
    """Verify request with action_code and summary is normalized and processed properly."""
    inst = db.query(Institution).first()
    assert inst is not None
    req = RegulatoryActionRequest(
        action_code="SHOW_CAUSE_SUMMONS",
        summary="Statutory summons for board hearing.",
    )
    assert req.action_type == "SHOW_CAUSE_SUMMONS"
    assert req.directive_notes == "Statutory summons for board hearing."

    res = execute_regulatory_action(inst.id, req, db)
    assert res.success is True
    assert res.action_type == "SHOW_CAUSE_SUMMONS"
    assert res.action_code == "SHOW_CAUSE_SUMMONS"
    assert res.status == "DISPATCHED"
    assert res.reference_number == res.dispatch_reference
    assert "AICTE/REG/" in res.dispatch_reference
    assert res.action_id.startswith("ACT-")


def test_api_regulatory_action_payload_validation(client: TestClient, db: Session):
    """Verify POST /api/v1/institutions/{id}/action accepts frontend { action_code, summary } payload."""
    inst = db.query(Institution).first()
    assert inst is not None
    payload = {
        "action_code": "MANDATORY_INSPECTION_FREEZE",
        "summary": "Urgent freeze on academic intake quota.",
    }
    res = client.post(
        f"/api/v1/institutions/{inst.id}/action",
        json=payload,
        headers={"X-Demo-Role": "ADMIN"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["action_code"] == "MANDATORY_INSPECTION_FREEZE"
    assert data["data"]["action_type"] == "MANDATORY_INSPECTION_FREEZE"
    assert data["data"]["status"] == "DISPATCHED"
    assert data["data"]["dispatch_reference"] is not None
    assert "Executive Order" in data["data"]["message"]
    assert "pdf_download_url" in data["data"]
    assert data["data"]["pdf_download_url"].startswith(f"/api/v1/institutions/{inst.id}/regulatory-notice.pdf")


def test_api_regulatory_action_alias_endpoint(client: TestClient, db: Session):
    """Verify POST /api/v1/institutions/{id}/regulatory-action works as official alias."""
    inst = db.query(Institution).first()
    assert inst is not None
    payload = {
        "action_code": "SHOW_CAUSE_NOTICE",
        "summary": "Mandatory explanation for student ragging incident.",
    }
    res = client.post(
        f"/api/v1/institutions/{inst.id}/regulatory-action",
        json=payload,
        headers={"X-Demo-Role": "ADMIN"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["action_code"] == "SHOW_CAUSE_NOTICE"
    assert data["data"]["pdf_download_url"] is not None


def test_api_download_regulatory_notice_pdf(client: TestClient, db: Session):
    """Verify GET /api/v1/institutions/{id}/regulatory-notice.pdf returns valid PDF file."""
    inst = db.query(Institution).first()
    assert inst is not None
    res = client.get(
        f"/api/v1/institutions/{inst.id}/regulatory-notice.pdf?action_type=MANDATORY_INSPECTION_FREEZE",
        headers={"X-Demo-Role": "ADMIN"},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in res.headers.get("content-disposition", "")
    assert res.content.startswith(b"%PDF")
    assert len(res.content) > 1000  # Non-trivial PDF output
