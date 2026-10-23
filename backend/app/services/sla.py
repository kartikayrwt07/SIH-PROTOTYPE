from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.sla import SLAPolicy, CasePriority
from backend.app.models.user import User, UserRole
from backend.app.models.audit import AuditEventType
from backend.app.services.audit import log_case_event


DEFAULT_PRIORITY_HOURS = {
    CasePriority.URGENT: 48,
    CasePriority.HIGH: 72,
    CasePriority.MEDIUM: 168,
    CasePriority.LOW: 336,
}


def calculate_sla_deadline(
    db: Session,
    category: str,
    priority: CasePriority,
    start_time: Optional[datetime] = None,
) -> datetime:
    """Calculate SLA resolution deadline using active policy rules or priority fallback."""
    if not start_time:
        start_time = datetime.now(timezone.utc)
    elif start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    policy = (
        db.query(SLAPolicy)
        .filter(
            SLAPolicy.category == category,
            SLAPolicy.priority == priority,
            SLAPolicy.is_active == True,
        )
        .first()
    )

    if not policy:
        # Fallback to category default or priority default
        policy = (
            db.query(SLAPolicy)
            .filter(SLAPolicy.priority == priority, SLAPolicy.is_active == True)
            .first()
        )

    resolution_hours = policy.resolution_hours if policy else DEFAULT_PRIORITY_HOURS.get(priority, 168)
    return start_time + timedelta(hours=resolution_hours)


def compute_case_sla_risk(
    case: ComplaintCase,
    current_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Evaluate remaining hours and risk category for a case."""
    if case.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED]:
        return {
            "status": "COMPLETED",
            "hours_remaining": None,
            "is_overdue": False,
            "escalation_level": case.escalation_level,
        }

    if not case.due_date:
        return {
            "status": "ON_TRACK",
            "hours_remaining": None,
            "is_overdue": False,
            "escalation_level": case.escalation_level,
        }

    now = current_time or datetime.now(timezone.utc)
    due_date = case.due_date
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    delta = due_date - now
    hours_remaining = delta.total_seconds() / 3600.0

    if hours_remaining < 0:
        risk_status = "OVERDUE"
    elif hours_remaining <= 48 or case.escalation_level >= 1:
        risk_status = "APPROACHING"
    else:
        risk_status = "ON_TRACK"

    return {
        "status": risk_status,
        "hours_remaining": round(hours_remaining, 1),
        "is_overdue": hours_remaining < 0,
        "escalation_level": case.escalation_level,
    }


def escalate_case(
    db: Session,
    case: ComplaintCase,
    actor: User,
    reason: str,
) -> ComplaintCase:
    """Escalate a stalled case to a higher administrative surveillance level."""
    if actor.role not in [UserRole.SUPERVISOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Supervisors and System Administrators can escalate cases.",
        )

    if case.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot escalate a case in '{case.status.value}' state.",
        )

    if not reason or len(reason.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Escalation rationale is mandatory (minimum 3 characters).",
        )

    prev_level = case.escalation_level
    new_level = min(prev_level + 1, 3)
    case.escalation_level = new_level
    case.updated_at = datetime.now(timezone.utc)
    db.flush()

    log_case_event(
        db=db,
        case_id=case.id,
        actor=actor,
        event_type=AuditEventType.ESCALATED,
        previous_state=f"Level {prev_level}",
        new_state=f"Level {new_level}",
        metadata_json={
            "escalated_by": actor.full_name,
            "escalated_by_role": actor.role.value,
            "previous_level": prev_level,
            "new_level": new_level,
            "reason": reason.strip(),
        },
    )

    db.commit()
    db.refresh(case)
    return case
