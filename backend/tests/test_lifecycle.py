import pytest
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base
from backend.app.models import (
    Bureau,
    User,
    UserRole,
    Institution,
    ComplaintCase,
    CaseStatus,
    CasePriority,
    AuditEventType,
)
from backend.app.services.lifecycle import (
    execute_transition,
    reopen_case,
    reject_case,
    can_transition,
    get_allowed_transitions,
)

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        # Seed test bureau, institution, and users
        bureau = Bureau(code="APPR", name="Approval Bureau")
        other_bureau = Bureau(code="STU", name="Student Welfare")
        session.add_all([bureau, other_bureau])
        session.flush()

        inst = Institution(aicte_permanent_id="1-9999", name="Test Engineering College", state="Delhi", district="New Delhi")
        session.add(inst)
        session.flush()

        officer = User(id="off-appr", email="officer.appr@aicte.gov.in", full_name="Officer Appr", role=UserRole.OFFICER, bureau_id=bureau.id, hashed_password="pw")
        supervisor = User(id="sup-1", email="sup@aicte.gov.in", full_name="Supervisor", role=UserRole.SUPERVISOR, hashed_password="pw")
        session.add_all([officer, supervisor])
        session.commit()

        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=test_engine)


def test_valid_transition_tracer(db_session):
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-TRACER",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Lab Equipment Shortage",
        description_redacted="Labs missing equipment",
        category="Infrastructure",
        priority=CasePriority.MEDIUM,
        status=CaseStatus.RECEIVED
    )
    db_session.add(case)
    db_session.commit()

    # Transition Received -> Registered
    updated = execute_transition(
        db=db_session,
        case=case,
        to_status=CaseStatus.REGISTERED,
        actor=supervisor,
        remarks="Case registered following preliminary intake check"
    )

    assert updated.status == CaseStatus.REGISTERED
    assert len(updated.audit_events) == 1
    assert updated.audit_events[0].new_state == "Registered"
    assert updated.audit_events[0].metadata_json["remarks"] == "Case registered following preliminary intake check"


def test_disallowed_transition_raises_422(db_session):
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-INVALID",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Invalid Jump Test",
        description_redacted="Test",
        category="Infrastructure",
        priority=CasePriority.LOW,
        status=CaseStatus.RECEIVED
    )
    db_session.add(case)
    db_session.commit()

    # Attempting to jump directly from Received -> Resolved must be blocked
    with pytest.raises(HTTPException) as exc_info:
        execute_transition(
            db=db_session,
            case=case,
            to_status=CaseStatus.RESOLVED,
            actor=supervisor,
            remarks="Illegal bypass"
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["code"] == "INVALID_STATE_TRANSITION"
    assert "Registered" in exc_info.value.detail["allowed_transitions"]


def test_closed_case_is_terminal(db_session):
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-CLOSED",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Closed Case Test",
        description_redacted="Test",
        category="Infrastructure",
        priority=CasePriority.LOW,
        status=CaseStatus.CLOSED
    )
    db_session.add(case)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        execute_transition(
            db=db_session,
            case=case,
            to_status=CaseStatus.IN_PROGRESS,
            actor=supervisor,
            remarks="Reopening closed case"
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["code"] == "CASE_IS_CLOSED"


def test_reopen_workflow(db_session):
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-REOPEN",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Reopen Test",
        description_redacted="Test",
        category="Infrastructure",
        priority=CasePriority.HIGH,
        status=CaseStatus.RESOLVED,
        resolved_at=datetime.utcnow()
    )
    db_session.add(case)
    db_session.commit()

    reopened = reopen_case(
        db=db_session,
        case=case,
        actor=supervisor,
        reopen_reason="Complainant reported fee was only partially refunded."
    )

    assert reopened.status == CaseStatus.IN_PROGRESS
    assert reopened.resolved_at is None
    latest_event = reopened.audit_events[-1]
    assert latest_event.event_type == AuditEventType.REOPENED


def test_bureau_jurisdiction_in_transition(db_session):
    other_bureau = db_session.query(Bureau).filter_by(code="STU").first()
    inst = db_session.query(Institution).first()
    officer_appr = db_session.query(User).filter_by(email="officer.appr@aicte.gov.in").first()

    # Case belongs to Student Welfare (STU)
    case = ComplaintCase(
        case_reference_id="AICTE-2026-STU-01",
        institution_id=inst.id,
        bureau_id=other_bureau.id,
        subject="Ragging Complaint",
        description_redacted="Ragging report",
        category="Ragging",
        priority=CasePriority.URGENT,
        status=CaseStatus.ASSIGNED
    )
    db_session.add(case)
    db_session.commit()

    # Approval Bureau Officer attempting to mutate STU case must be rejected
    with pytest.raises(HTTPException) as exc_info:
        execute_transition(
            db=db_session,
            case=case,
            to_status=CaseStatus.IN_PROGRESS,
            actor=officer_appr,
            remarks="Attempted cross-bureau update"
        )
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "INSUFFICIENT_BUREAU_PERMISSIONS"


def test_rejection_from_registered_leaves_resolved_at_none(db_session):
    """Verify malformed or spam tickets are routed to REJECTED with resolved_at remaining None."""
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-SPAM-001",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Win a free iPhone survey spam",
        description_redacted="Automated bot promotional spam submission",
        category="Spam",
        priority=CasePriority.LOW,
        status=CaseStatus.REGISTERED
    )
    db_session.add(case)
    db_session.commit()

    # Reject as spam
    rejected = reject_case(
        db=db_session,
        case=case,
        actor=supervisor,
        rejection_reason="Automated promotional spam with invalid complainant details."
    )

    assert rejected.status == CaseStatus.REJECTED
    # CRITICAL: resolved_at must remain None to prevent corrupting Average Resolution Time
    assert rejected.resolved_at is None
    assert rejected.closed_at is not None
    assert "[REJECTED / SPAM]" in rejected.closure_remarks
    assert len(rejected.audit_events) == 1
    assert rejected.audit_events[0].event_type == AuditEventType.REJECTED


def test_rejected_case_is_terminal(db_session):
    """Verify rejected tickets cannot transition further into active investigation states."""
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-REJECTED-TERM",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Malformed ticket",
        description_redacted="Empty payload",
        category="Malformed",
        priority=CasePriority.LOW,
        status=CaseStatus.REJECTED,
        closure_remarks="Rejected at registration"
    )
    db_session.add(case)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        execute_transition(
            db=db_session,
            case=case,
            to_status=CaseStatus.IN_PROGRESS,
            actor=supervisor,
            remarks="Attempt to resuscitate rejected ticket"
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["code"] == "CASE_IS_REJECTED"


def test_reopen_rejected_case_blocked(db_session):
    """Verify only legitimately 'Resolved' cases can be reopened, not rejected spam."""
    bureau = db_session.query(Bureau).filter_by(code="APPR").first()
    inst = db_session.query(Institution).first()
    supervisor = db_session.query(User).filter_by(role=UserRole.SUPERVISOR).first()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-REJECTED-REOPEN",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Spam ticket",
        description_redacted="Spam",
        category="Spam",
        priority=CasePriority.LOW,
        status=CaseStatus.REJECTED
    )
    db_session.add(case)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        reopen_case(
            db=db_session,
            case=case,
            actor=supervisor,
            reopen_reason="Attempt to appeal rejected spam"
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["code"] == "CANNOT_REOPEN"

