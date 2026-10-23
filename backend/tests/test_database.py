import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from backend.app.core.database import Base
from backend.app.models import (
    Bureau,
    User,
    UserRole,
    Institution,
    ComplaintCase,
    CaseStatus,
    CasePriority,
    SLAPolicy,
    CaseAssignmentHistory,
    CaseNote,
    CaseAuditEvent,
    AuditEventType,
)

# In-memory SQLite for testing isolation
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=test_engine)


def test_create_bureau_and_user(db_session):
    bureau = Bureau(
        code="APPR",
        name="Approval Bureau",
        description="Handles institution approvals"
    )
    db_session.add(bureau)
    db_session.commit()

    user = User(
        email="officer.appr@aicte-demo.gov.in",
        full_name="Rajesh Kumar",
        role=UserRole.OFFICER,
        bureau_id=bureau.id,
        hashed_password="hashed_demo_pw"
    )
    db_session.add(user)
    db_session.commit()

    saved_user = db_session.query(User).filter_by(email="officer.appr@aicte-demo.gov.in").first()
    assert saved_user is not None
    assert saved_user.bureau.code == "APPR"
    assert saved_user.role == UserRole.OFFICER


def test_unique_case_reference_constraint(db_session):
    bureau = Bureau(code="STU", name="Student Welfare Cell")
    inst = Institution(
        aicte_permanent_id="1-0000001",
        name="Apex College of Engineering",
        state="Maharashtra",
        district="Pune"
    )
    db_session.add_all([bureau, inst])
    db_session.commit()

    case1 = ComplaintCase(
        case_reference_id="AICTE-2026-TEST",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Fee Refund Delay",
        description_redacted="Refund not issued after admission cancellation",
        category="Fee Disputes",
        priority=CasePriority.HIGH,
        status=CaseStatus.RECEIVED
    )
    db_session.add(case1)
    db_session.commit()

    # Attempting to insert duplicate reference ID must fail
    case2 = ComplaintCase(
        case_reference_id="AICTE-2026-TEST",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Duplicate Case Reference",
        description_redacted="Duplicate entry attempt",
        category="Fee Disputes",
        priority=CasePriority.LOW,
        status=CaseStatus.RECEIVED
    )
    db_session.add(case2)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_case_lifecycle_and_audit_relationship(db_session):
    bureau = Bureau(code="FIN", name="Finance Bureau")
    inst = Institution(
        aicte_permanent_id="1-0000002",
        name="National Tech Institute",
        state="Karnataka",
        district="Bengaluru"
    )
    db_session.add_all([bureau, inst])
    db_session.commit()

    case = ComplaintCase(
        case_reference_id="AICTE-2026-0042",
        institution_id=inst.id,
        bureau_id=bureau.id,
        subject="Excess Tuition Charged",
        description_redacted="College demanded extra tuition fees",
        category="Fee Disputes",
        priority=CasePriority.MEDIUM,
        status=CaseStatus.REGISTERED,
        due_date=datetime.utcnow() + timedelta(days=7)
    )
    db_session.add(case)
    db_session.commit()

    # Log an audit event
    audit = CaseAuditEvent(
        case_id=case.id,
        actor_role="OFFICER",
        event_type=AuditEventType.STATUS_CHANGE,
        previous_state=CaseStatus.RECEIVED.value,
        new_state=CaseStatus.REGISTERED.value,
        metadata_json={"remarks": "Initial verification completed"}
    )
    db_session.add(audit)
    db_session.commit()

    saved_case = db_session.query(ComplaintCase).filter_by(case_reference_id="AICTE-2026-0042").first()
    assert len(saved_case.audit_events) == 1
    assert saved_case.audit_events[0].new_state == "Registered"
