from typing import Dict, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.user import User, UserRole
from backend.app.models.audit import AuditEventType
from backend.app.services.audit import log_case_event
from backend.app.core.auth import assert_bureau_access

ALLOWED_TRANSITIONS: Dict[CaseStatus, List[CaseStatus]] = {
    CaseStatus.RECEIVED: [CaseStatus.REGISTERED, CaseStatus.REJECTED],
    CaseStatus.REGISTERED: [CaseStatus.UNDER_TRIAGE, CaseStatus.REJECTED],
    CaseStatus.UNDER_TRIAGE: [CaseStatus.ASSIGNED, CaseStatus.REJECTED],
    CaseStatus.ASSIGNED: [CaseStatus.IN_PROGRESS, CaseStatus.REJECTED],
    CaseStatus.IN_PROGRESS: [CaseStatus.AWAITING_INFORMATION, CaseStatus.UNDER_REVIEW, CaseStatus.REJECTED],
    CaseStatus.AWAITING_INFORMATION: [CaseStatus.IN_PROGRESS, CaseStatus.REJECTED],
    CaseStatus.UNDER_REVIEW: [CaseStatus.IN_PROGRESS, CaseStatus.RESOLVED, CaseStatus.REJECTED],
    CaseStatus.RESOLVED: [CaseStatus.CLOSED, CaseStatus.IN_PROGRESS],  # Reopen path
    CaseStatus.CLOSED: [],  # Terminal state
    CaseStatus.REJECTED: [],  # Dedicated terminal state for malformed, spam, or out-of-jurisdiction complaints
}


def can_transition(from_state: CaseStatus, to_state: CaseStatus) -> bool:
    """Check whether a transition between two states is legally allowed."""
    return to_state in ALLOWED_TRANSITIONS.get(from_state, [])


def get_allowed_transitions(from_state: CaseStatus) -> List[CaseStatus]:
    """Return all valid next states for a given state."""
    return ALLOWED_TRANSITIONS.get(from_state, [])


def execute_transition(
    db: Session,
    case: ComplaintCase,
    to_status: CaseStatus,
    actor: User,
    remarks: str,
) -> ComplaintCase:
    """Advance case lifecycle status with guard enforcement and audit trail recording."""
    # 1. Assert actor has jurisdiction over this bureau
    assert_bureau_access(actor, case.bureau_id)

    # 2. Check if case is terminal
    if case.status == CaseStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "CASE_IS_CLOSED",
                "message": f"Case {case.case_reference_id} is formally Closed and cannot transition further.",
                "allowed_transitions": []
            }
        )
    if case.status == CaseStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "CASE_IS_REJECTED",
                "message": f"Case {case.case_reference_id} has been formally Rejected / Marked as Spam and cannot transition further.",
                "allowed_transitions": []
            }
        )

    # 3. Check legal transition
    if not can_transition(case.status, to_status):
        allowed = [s.value for s in get_allowed_transitions(case.status)]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_STATE_TRANSITION",
                "message": f"Cannot transition case {case.case_reference_id} from '{case.status.value}' to '{to_status.value}'.",
                "current_status": case.status.value,
                "attempted_status": to_status.value,
                "allowed_transitions": allowed
            }
        )

    # 4. Mandatory remarks guard
    if not remarks or len(remarks.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "MISSING_REMARKS",
                "message": "Mandatory remarks are required to execute a lifecycle state transition."
            }
        )

    previous_state = case.status
    now = datetime.now(timezone.utc)
    event_type = AuditEventType.STATUS_CHANGE

    # 5. Handle special transition guards
    if to_status == CaseStatus.RESOLVED:
        case.resolved_at = now
        case.closure_remarks = remarks
        event_type = AuditEventType.RESOLVED
    elif to_status == CaseStatus.CLOSED:
        case.closed_at = now
        if not case.closure_remarks:
            case.closure_remarks = remarks
        event_type = AuditEventType.CLOSED
    elif to_status == CaseStatus.REJECTED:
        case.closed_at = now
        case.resolved_at = None  # Critical: Never set resolved_at on rejected/spam cases to prevent metrics corruption
        case.closure_remarks = f"[REJECTED / SPAM]: {remarks.strip()}"
        event_type = AuditEventType.REJECTED
    elif previous_state == CaseStatus.RESOLVED and to_status == CaseStatus.IN_PROGRESS:
        # Reopening workflow
        case.resolved_at = None
        event_type = AuditEventType.REOPENED

    # 6. Apply state change
    case.status = to_status
    case.updated_at = now
    db.flush()

    # 7. Log append-only audit record
    log_case_event(
        db=db,
        case_id=case.id,
        actor=actor,
        event_type=event_type,
        previous_state=previous_state.value,
        new_state=to_status.value,
        metadata_json={
            "remarks": remarks,
            "action": "execute_transition"
        },
        timestamp=now
    )

    db.commit()
    db.refresh(case)
    return case


def reopen_case(
    db: Session,
    case: ComplaintCase,
    actor: User,
    reopen_reason: str,
) -> ComplaintCase:
    """Authorized reopening of a previously Resolved case."""
    if actor.role not in [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "UNAUTHORIZED_REOPEN", "message": "Only authorized officers or supervisors can reopen a case."}
        )

    if case.status != CaseStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "CANNOT_REOPEN", "message": f"Only 'Resolved' cases can be reopened. Current status: '{case.status.value}'."}
        )

    return execute_transition(
        db=db,
        case=case,
        to_status=CaseStatus.IN_PROGRESS,
        actor=actor,
        remarks=f"[REOPEN AUTHORIZED]: {reopen_reason}"
    )


def reject_case(
    db: Session,
    case: ComplaintCase,
    actor: User,
    rejection_reason: str,
) -> ComplaintCase:
    """Authorized rejection of a malformed, spam, or out-of-jurisdiction complaint."""
    if not rejection_reason or len(rejection_reason.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "MISSING_REJECTION_REASON",
                "message": "A detailed reason (minimum 5 characters) is required to reject a complaint as malformed or spam."
            }
        )

    return execute_transition(
        db=db,
        case=case,
        to_status=CaseStatus.REJECTED,
        actor=actor,
        remarks=rejection_reason.strip()
    )

