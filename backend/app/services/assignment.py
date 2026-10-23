from typing import Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.models.bureau import Bureau
from backend.app.models.case import ComplaintCase, CaseAssignmentHistory
from backend.app.models.user import User
from backend.app.models.audit import AuditEventType
from backend.app.services.audit import log_case_event


def assign_case(
    db: Session,
    case: ComplaintCase,
    to_bureau_id: str,
    to_officer_id: Optional[str],
    assigned_by: User,
    transfer_reason: str,
) -> ComplaintCase:
    """Reassign case to another bureau or officer with mandatory transfer reason and audit tracking."""
    if not transfer_reason or len(transfer_reason.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Transfer reason is mandatory (minimum 3 characters) to record procedural accountability."
        )

    # 1. Validate target bureau exists and is active
    to_bureau = db.query(Bureau).filter(Bureau.id == to_bureau_id).first()
    if not to_bureau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target bureau with ID '{to_bureau_id}' not found."
        )
    if not to_bureau.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target bureau '{to_bureau.name}' is inactive."
        )

    # 2. Validate officer if supplied
    to_officer_name = None
    if to_officer_id:
        to_officer = db.query(User).filter(User.id == to_officer_id).first()
        if not to_officer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target officer with ID '{to_officer_id}' not found."
            )
        if to_officer.bureau_id and to_officer.bureau_id != to_bureau_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Officer '{to_officer.full_name}' is not assigned to target bureau '{to_bureau.name}'."
            )
        to_officer_name = to_officer.full_name

    from_bureau_id = case.bureau_id
    from_bureau_code = case.bureau.code if case.bureau else from_bureau_id
    from_officer_id = case.assigned_officer_id

    # 3. Create persistent assignment history record
    history = CaseAssignmentHistory(
        case_id=case.id,
        from_bureau_id=from_bureau_id,
        to_bureau_id=to_bureau_id,
        assigned_by_id=assigned_by.id,
        transfer_reason=transfer_reason.strip(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(history)

    # 4. Update case jurisdiction
    case.bureau_id = to_bureau_id
    case.assigned_officer_id = to_officer_id
    case.updated_at = datetime.now(timezone.utc)
    db.flush()

    # 5. Emit immutable audit event
    log_case_event(
        db=db,
        case_id=case.id,
        actor=assigned_by,
        event_type=AuditEventType.REASSIGNED,
        previous_state=f"Bureau: {from_bureau_code}",
        new_state=f"Bureau: {to_bureau.code}",
        metadata_json={
            "from_bureau_id": from_bureau_id,
            "to_bureau_id": to_bureau_id,
            "to_bureau_code": to_bureau.code,
            "to_bureau_name": to_bureau.name,
            "from_officer_id": from_officer_id,
            "to_officer_id": to_officer_id,
            "to_officer_name": to_officer_name,
            "transfer_reason": transfer_reason.strip(),
        },
    )

    db.commit()
    db.refresh(case)
    return case
