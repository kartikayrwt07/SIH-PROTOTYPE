import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base
from backend.app.models import (
    Bureau,
    User,
    Institution,
    ComplaintCase,
    CaseStatus,
    CaseAuditEvent,
    CaseAssignmentHistory,
    SLAPolicy,
)
from backend.scripts.seed import seed_database

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module")
def seeded_db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        seed_database(session)
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


def test_seed_counts(seeded_db):
    bureaus_count = seeded_db.query(Bureau).count()
    users_count = seeded_db.query(User).count()
    institutions_count = seeded_db.query(Institution).count()
    cases_count = seeded_db.query(ComplaintCase).count()
    sla_count = seeded_db.query(SLAPolicy).count()

    assert bureaus_count == 4
    assert users_count >= 4
    assert institutions_count >= 15
    assert cases_count >= 50
    assert sla_count >= 5


def test_seed_lifecycle_coverage(seeded_db):
    cases = seeded_db.query(ComplaintCase).all()
    statuses_present = {c.status for c in cases}
    all_statuses = {
        CaseStatus.RECEIVED,
        CaseStatus.REGISTERED,
        CaseStatus.UNDER_TRIAGE,
        CaseStatus.ASSIGNED,
        CaseStatus.IN_PROGRESS,
        CaseStatus.AWAITING_INFORMATION,
        CaseStatus.UNDER_REVIEW,
        CaseStatus.RESOLVED,
        CaseStatus.CLOSED,
    }
    assert statuses_present == all_statuses, f"Missing statuses: {all_statuses - statuses_present}"


def test_seed_sla_risk_distribution(seeded_db):
    overdue_cases = seeded_db.query(ComplaintCase).filter(ComplaintCase.escalation_level == 2).count()
    approaching_cases = seeded_db.query(ComplaintCase).filter(ComplaintCase.escalation_level == 1).count()

    assert overdue_cases >= 4, f"Expected at least 4 overdue cases, found {overdue_cases}"
    assert approaching_cases >= 6, f"Expected at least 6 approaching cases, found {approaching_cases}"


def test_seed_audit_trail_integrity(seeded_db):
    cases = seeded_db.query(ComplaintCase).all()
    for case in cases:
        assert len(case.audit_events) >= 1, f"Case {case.case_reference_id} has no audit events"
        registration_event = next((e for e in case.audit_events if e.event_type.value == "REGISTERED"), None)
        assert registration_event is not None, f"Case {case.case_reference_id} missing registration audit event"
