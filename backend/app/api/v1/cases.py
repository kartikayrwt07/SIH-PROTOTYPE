from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user, assert_bureau_access, sanitize_case_for_role
from backend.app.models.institution import Institution
from backend.app.models.user import User, UserRole
from backend.app.models.case import ComplaintCase, CaseStatus, CasePriority, CaseNote
from backend.app.models.audit import AuditEventType
from backend.app.schemas.case import (
    ComplaintCaseRead,
    StatusTransitionRequest,
    TimelineEventRead,
    CaseNoteCreate,
    CaseNoteRead,
)
from backend.app.schemas.common import StandardResponse, PaginatedResponse, PaginationMetadata
from backend.app.services.lifecycle import execute_transition, reopen_case
from backend.app.services.audit import get_case_audit_trail, log_case_event

router = APIRouter(prefix="/cases")


@router.get("", response_model=PaginatedResponse[ComplaintCaseRead])
def list_cases(
    bureau_id: Optional[str] = Query(None, description="Filter by Bureau ID"),
    institution_id: Optional[str] = Query(None, description="Filter by Institution ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by CaseStatus"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by CasePriority"),
    search: Optional[str] = Query(None, description="Search by subject, case reference ID, category, or institution name"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, due_date, priority, status, subject"),
    sort_dir: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated case catalog with server-side bureau scoping, institution search, and dynamic sorting."""
    query = db.query(ComplaintCase).join(Institution, ComplaintCase.institution_id == Institution.id, isouter=True)

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

    # Institution filter
    if institution_id:
        query = query.filter(ComplaintCase.institution_id == institution_id)

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

    # Search filter (matches case_reference_id, subject, category, and institution name)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ComplaintCase.case_reference_id.ilike(term),
                ComplaintCase.subject.ilike(term),
                ComplaintCase.category.ilike(term),
                Institution.name.ilike(term),
            )
        )

    total_records = query.count()
    total_pages = (total_records + page_size - 1) // page_size if total_records > 0 else 1

    # Dynamic sorting
    valid_sort_columns = {
        "created_at": ComplaintCase.created_at,
        "due_date": ComplaintCase.due_date,
        "priority": ComplaintCase.priority,
        "status": ComplaintCase.status,
        "subject": ComplaintCase.subject,
    }
    sort_col = valid_sort_columns.get(sort_by, ComplaintCase.created_at)
    if sort_dir.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    cases = (
        query.offset((page - 1) * page_size)
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


@router.get("/{case_ref}/notes", response_model=StandardResponse[List[CaseNoteRead]])
def list_case_notes(
    case_ref: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve case internal notes. Read-only auditors cannot view confidential notes."""
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference ID '{case_ref}' not found."
        )

    assert_bureau_access(current_user, case.bureau_id)

    query = db.query(CaseNote).filter(CaseNote.case_id == case.id)
    if current_user.role == UserRole.AUDITOR:
        query = query.filter(CaseNote.is_confidential == False)

    notes = query.order_by(CaseNote.created_at.desc()).all()
    note_reads = [CaseNoteRead.model_validate(n) for n in notes]
    return StandardResponse(data=note_reads)


@router.post("/{case_ref}/notes", response_model=StandardResponse[CaseNoteRead])
def add_case_note(
    case_ref: str,
    note_in: CaseNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an internal note to the case dossier. Emits an immutable NOTE_ADDED audit record."""
    if current_user.role == UserRole.AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Read-Only Auditor role cannot create case notes."
        )

    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference ID '{case_ref}' not found."
        )

    assert_bureau_access(current_user, case.bureau_id)

    new_note = CaseNote(
        case_id=case.id,
        author_id=current_user.id,
        content=note_in.content.strip(),
        is_confidential=note_in.is_confidential,
    )
    db.add(new_note)
    db.flush()

    # Append immutable audit event
    log_case_event(
        db=db,
        case_id=case.id,
        actor=current_user,
        event_type=AuditEventType.NOTE_ADDED,
        metadata_json={
            "note_id": new_note.id,
            "is_confidential": new_note.is_confidential,
            "snippet": new_note.content[:80] + ("..." if len(new_note.content) > 80 else ""),
        },
    )

    db.commit()
    db.refresh(new_note)

    return StandardResponse(data=CaseNoteRead.model_validate(new_note))

