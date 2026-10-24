"""
Unit and integration tests for Smart Duplicate Grouping (Master Tickets).

Tests cover:
- Cluster auto-detection via semantic similarity and institution clustering
- Master ticket creation with child case linking
- Cascading status resolution to all child cases
- Time-saved calculations and dashboard metrics
- Master ticket API endpoints
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.case import ComplaintCase, CaseStatus, CasePriority
from backend.app.models.master_ticket import MasterTicket, MasterTicketChild, MasterTicketStatus
from backend.app.schemas.master_ticket import (
    AutoDetectDuplicateGroupRequest,
    CreateMasterTicketRequest,
    ResolveMasterTicketRequest,
)
from backend.app.services.duplicate_grouping import (
    auto_detect_duplicate_groups,
    create_master_ticket,
    resolve_master_ticket,
    get_master_ticket_stats,
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


@pytest.fixture
def auth_headers():
    return {"X-Demo-Role": "SUPERVISOR"}


@pytest.fixture
def setup_cluster_cases(db: Session):
    """Creates a cluster of 5 complaints from the same college complaining about unapproved fees."""
    # Find or create institution
    inst = db.query(Institution).first()
    if not inst:
        inst = Institution(
            aicte_permanent_id="1-TEST-COLL",
            name="Apex Institute of Technology",
            state="Maharashtra",
            city="Pune",
        )
        db.add(inst)
        db.commit()
        db.refresh(inst)

    # Find bureau
    bureau = db.query(Bureau).filter(Bureau.code == "BUR-FIN").first()
    if not bureau:
        bureau = db.query(Bureau).first()

    import uuid
    from backend.app.models.audit import CaseAuditEvent, AuditEventType

    cases = []
    uid = uuid.uuid4().hex[:6]
    for i in range(5):
        case_ref = f"AIC-CLUSTER-{uid}-{i+1}"
        case = ComplaintCase(
            case_reference_id=case_ref,
            institution_id=inst.id,
            bureau_id=bureau.id if bureau else None,
            category="Unapproved Fee",
            subject=f"Illegal examination and lab fee charged without AICTE approval #{i+1}",
            description_confidential=f"College administration is forcing all students to pay Rs 25,000 unapproved development fee and extra lab charges contrary to AICTE fee regulations #{i+1}.",
            description_redacted=f"College administration is forcing all students to pay unapproved fee contrary to AICTE fee regulations #{i+1}.",
            status=CaseStatus.RECEIVED,
            priority=CasePriority.MEDIUM,
        )
        db.add(case)
        db.flush()

        audit = CaseAuditEvent(
            case_id=case.id,
            actor_role="STUDENT",
            event_type=AuditEventType.REGISTERED,
            previous_state="Unregistered",
            new_state="RECEIVED",
            timestamp=datetime.now(timezone.utc),
        )
        db.add(audit)
        cases.append(case)

    db.commit()
    for c in cases:
        db.refresh(c)

    return cases


def test_detect_duplicate_clusters(db: Session, setup_cluster_cases):
    """Test AI detection of complaint clusters with high semantic similarity."""
    req = AutoDetectDuplicateGroupRequest(
        similarity_threshold=0.60,
        min_group_size=2,
    )
    res = auto_detect_duplicate_groups(db, req)
    assert res.total_cases_scanned >= 5
    assert res.groups_detected >= 1

    # Verify at least one group has the cluster cases
    cluster_group = next(
        (g for g in res.groups if any(c.case_reference_id in g.member_case_refs for c in setup_cluster_cases)),
        None,
    )
    assert cluster_group is not None
    assert cluster_group.member_count >= 2
    assert cluster_group.category == "Unapproved Fee"
    assert cluster_group.avg_similarity > 0


def test_create_and_resolve_master_ticket(db: Session, setup_cluster_cases):
    """Test creating a Master Ticket and resolving it with cascading updates to all children."""
    refs = [c.case_reference_id for c in setup_cluster_cases]

    # Create Master Ticket
    req = CreateMasterTicketRequest(
        case_reference_ids=refs,
        consolidated_subject="Unapproved Fee Cluster - Apex Institute",
    )

    created = create_master_ticket(db, req)
    assert created.ticket_reference_id.startswith("MT-")
    assert created.child_count == len(refs)

    # Verify children in DB
    ticket = db.query(MasterTicket).filter(
        MasterTicket.ticket_reference_id == created.ticket_reference_id
    ).first()
    assert ticket is not None
    assert len(ticket.children) == len(refs)

    # Resolve Master Ticket
    resolve_req = ResolveMasterTicketRequest(
        resolution_remarks="AICTE inquiry completed. College ordered to refund all unapproved fee collections immediately.",
        child_status="Resolved",
    )
    resolved = resolve_master_ticket(
        db,
        created.ticket_reference_id,
        resolve_req,
    )
    assert resolved.children_resolved == len(refs)
    assert resolved.total_time_saved_hours > 0

    # Verify child complaint cases were cascaded to Resolved
    for ref in refs:
        child_case = db.query(ComplaintCase).filter(
            ComplaintCase.case_reference_id == ref
        ).first()
        assert child_case is not None
        assert child_case.status == CaseStatus.RESOLVED


def test_master_ticket_api_flow(client: TestClient, auth_headers, setup_cluster_cases):
    """Integration test of Master Ticket API endpoints."""
    # 1. Detect
    detect_res = client.post(
        "/api/v1/ai/master-tickets/detect",
        headers=auth_headers,
        json={"similarity_threshold": 0.50, "min_group_size": 2},
    )
    assert detect_res.status_code == 200
    data = detect_res.json()["data"]
    assert data["groups_detected"] >= 1

    # 2. Stats
    stats_res = client.get("/api/v1/ai/master-tickets/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert "total_master_tickets" in stats
    assert "total_time_saved_hours" in stats

    # 3. List
    list_res = client.get("/api/v1/ai/master-tickets/", headers=auth_headers)
    assert list_res.status_code == 200
    assert isinstance(list_res.json()["data"], list)
