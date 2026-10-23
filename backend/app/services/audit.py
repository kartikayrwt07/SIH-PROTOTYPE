from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.audit import CaseAuditEvent, AuditEventType
from backend.app.models.user import User


def log_case_event(
    db: Session,
    case_id: str,
    actor: User,
    event_type: AuditEventType,
    previous_state: Optional[str] = None,
    new_state: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None,
    timestamp: Optional[datetime] = None,
) -> CaseAuditEvent:
    """Append an immutable audit event to the case's chronological history."""
    event = CaseAuditEvent(
        case_id=case_id,
        actor_id=actor.id if actor else None,
        actor_role=actor.role.value if actor else "SYSTEM",
        event_type=event_type,
        previous_state=previous_state,
        new_state=new_state,
        metadata_json=metadata_json or {},
        timestamp=timestamp or datetime.now(timezone.utc)
    )
    db.add(event)
    db.flush()
    return event


def get_case_audit_trail(db: Session, case_id: str) -> List[CaseAuditEvent]:
    """Retrieve all audit events for a case ordered chronologically."""
    return (
        db.query(CaseAuditEvent)
        .filter(CaseAuditEvent.case_id == case_id)
        .order_by(CaseAuditEvent.timestamp.asc())
        .all()
    )
