from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user, assert_bureau_access, sanitize_case_for_role
from backend.app.models.user import User, UserRole
from backend.app.models.case import ComplaintCase, CaseStatus, CasePriority
from backend.app.schemas.case import (
    ComplaintCaseRead,
    StatusTransitionRequest,
    TimelineEventRead,
)
from backend.app.schemas.common import StandardResponse, PaginatedResponse, PaginationMetadata
from backend.app.services.lifecycle import execute_transition, reopen_case
from backend.app.services.audit import get_case_audit_trail

router = APIRouter(prefix="/cases")


@router.get("", response_model=PaginatedResponse[ComplaintCaseRead])
def list_cases(
    bureau_id: Optional[str] = Query(None, description="Filter by Bureau ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by CaseStatus"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by CasePriority"),
    search: Optional[str] = Query(None, description="Search by subject, case reference ID, or category"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated case catalog with server-side bureau scoping and RBAC filtering."""
    query = db.query(ComplaintCase)

    # Server-side Bureau Scoping: Case Officer is restricted to their assigned bureau
    if current_user.role == UserRole.OFFICER:
        if current_user.bureau_id:
            query = query.filter(ComplaintCase.bureau_id == current_user.bureau_id)
        else:
            return PaginatedResponse(
                success=True,
                data=[],
                metadata=PaginationMetadata(
                    page=page, page_size=page_size, total_records=0, total_pages=0, has_next=False, has_prev=False
                )
            )
    elif bureau_id:
        query = query.filter(ComplaintCase.bureau_id == bureau_id)

    # Status filter
    if status_filter:
        try:
            status_enum = CaseStatus(status_filter)
            query = query.filter(ComplaintCase.status == status_enum)
        except ValueError:
            pass

    # Priority filter
    if priority_filter:
        try:
            priority_enum = CasePriority(priority_filter.upper())
            query = query.filter(ComplaintCase.priority == priority_enum)
        except ValueError:
            pass

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ComplaintCase.case_reference_id.ilike(term),
                ComplaintCase.subject.ilike(term),
                ComplaintCase.category.ilike(term),
            )
        )

    total_records = query.count()
    total_pages = (total_records + page_size - 1) // page_size if total_records > 0 else 1

    cases = (
        query.order_by(ComplaintCase.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Sanitize for Read-Only Auditor role
    processed_cases = []
    for c in cases:
        c_dict = ComplaintCaseRead.model_validate(c).model_dump()
        c_dict = sanitize_case_for_role(c_dict, current_user.role)
        processed_cases.append(ComplaintCaseRead(**c_dict))

    return PaginatedResponse(
        success=True,
        data=processed_cases,
        metadata=PaginationMetadata(
            page=page,
            page_size=page_size,
            total_records=total_records,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )
    )


@router.get("/{case_ref}", response_model=StandardResponse[ComplaintCaseRead])
def get_case_detail(
    case_ref: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve comprehensive case detail dossier."""
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference ID '{case_ref}' not found."
        )

    assert_bureau_access(current_user, case.bureau_id)

    case_dict = ComplaintCaseRead.model_validate(case).model_dump()
    case_dict = sanitize_case_for_role(case_dict, current_user.role)

    return StandardResponse(data=ComplaintCaseRead(**case_dict))


@router.post("/{case_ref}/transition", response_model=StandardResponse[ComplaintCaseRead])
def transition_case_status(
    case_ref: str,
    request: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute lifecycle state advancement with guard validation and audit recording."""
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference ID '{case_ref}' not found."
        )

    updated_case = execute_transition(
        db=db,
        case=case,
        to_status=request.to_status,
        actor=current_user,
        remarks=request.remarks
    )

    case_dict = ComplaintCaseRead.model_validate(updated_case).model_dump()
    case_dict = sanitize_case_for_role(case_dict, current_user.role)

    return StandardResponse(data=ComplaintCaseRead(**case_dict))


@router.post("/{case_ref}/reopen", response_model=StandardResponse[ComplaintCaseRead])
def reopen_resolved_case(
    case_ref: str,
    reason: str = Query(..., min_length=5, description="Formal justification for reopening case"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authorized reopening of a previously resolved grievance."""
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference ID '{case_ref}' not found."
        )

    reopened_case = reopen_case(
        db=db,
        case=case,
        actor=current_user,
        reopen_reason=reason
    )

    case_dict = ComplaintCaseRead.model_validate(reopened_case).model_dump()
    case_dict = sanitize_case_for_role(case_dict, current_user.role)

    return StandardResponse(data=ComplaintCaseRead(**case_dict))


@router.get("/{case_ref}/timeline", response_model=StandardResponse[List[TimelineEventRead]])
def get_case_timeline(
    case_ref: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve chronological append-only audit stream for the case."""
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference ID '{case_ref}' not found."
        )

    assert_bureau_access(current_user, case.bureau_id)

    events = get_case_audit_trail(db, case.id)
    event_reads = []
    for e in events:
        actor_name = e.actor.full_name if e.actor else "System Automated Engine"
        event_reads.append(
            TimelineEventRead(
                id=e.id,
                case_id=e.case_id,
                actor_id=e.actor_id,
                actor_role=e.actor_role,
                actor_name=actor_name,
                event_type=e.event_type.value,
                previous_state=e.previous_state,
                new_state=e.new_state,
                metadata_json=e.metadata_json,
                timestamp=e.timestamp,
            )
        )

    return StandardResponse(data=event_reads)
