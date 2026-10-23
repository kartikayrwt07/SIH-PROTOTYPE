"""
FastAPI Endpoints for Explainable AI Intelligence, Duplicate Detection,
and Human-in-the-Loop Triage Recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user, require_roles
from backend.app.models.user import User, UserRole
from backend.app.models.case import ComplaintCase
from backend.app.schemas.ai import (
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    TriageSuggestRequest,
    TriageSuggestion,
    TriageApplyRequest,
    TriageApplyResponse,
)
from backend.app.schemas.common import StandardResponse
from backend.app.services.ai_intelligence import (
    check_duplicate_complaints,
    compute_triage_suggestion,
    apply_triage_suggestion,
)

router = APIRouter()


@router.post(
    "/duplicates/check",
    response_model=StandardResponse[DuplicateCheckResponse],
    summary="Check potential duplicate complaints using TF-IDF cosine similarity"
)
def check_duplicates(
    request: DuplicateCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates incoming grievance text against registered database complaints
    using TF-IDF n-gram vectorization and cosine similarity.
    """
    try:
        result = check_duplicate_complaints(db, request)
        return StandardResponse(data=result, success=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Duplicate evaluation failed: {str(e)}"
        )


@router.get(
    "/duplicates/{case_ref}",
    response_model=StandardResponse[DuplicateCheckResponse],
    summary="Check duplicate collisions for an existing case reference"
)
def check_case_duplicates(
    case_ref: str,
    threshold: float = 0.35,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Computes duplicate collision matches for a specific complaint dossier,
    excluding self-comparison.
    """
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference '{case_ref}' not found."
        )

    case_desc = case.description_confidential or case.description_redacted or ""
    req = DuplicateCheckRequest(
        subject=case.subject,
        description=case_desc,
        institution_aicte_id=case.institution.aicte_permanent_id if case.institution else None,
        exclude_case_ref=case.case_reference_id,
        threshold=threshold,
    )
    result = check_duplicate_complaints(db, req)
    return StandardResponse(data=result, success=True)


@router.post(
    "/triage/suggest",
    response_model=StandardResponse[TriageSuggestion],
    summary="Compute explainable bureau routing and categorization recommendation"
)
def get_triage_suggestion(
    request: TriageSuggestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Recommends optimal bureau, category, and priority based on domain keyword
    affinity and institutional historical complaint patterns, outputting
    transparent explainability rationale factors.
    """
    try:
        suggestion = compute_triage_suggestion(db, request)
        return StandardResponse(data=suggestion, success=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Triage recommendation computation failed: {str(e)}"
        )


@router.get(
    "/triage/suggest/{case_ref}",
    response_model=StandardResponse[TriageSuggestion],
    summary="Generate triage suggestion for an existing registered complaint dossier"
)
def get_case_triage_suggestion(
    case_ref: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates intelligent triage suggestion for an existing case in the register.
    """
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == case_ref).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with reference '{case_ref}' not found."
        )

    case_desc = case.description_confidential or case.description_redacted or ""
    req = TriageSuggestRequest(
        subject=case.subject,
        description=case_desc,
        institution_aicte_id=case.institution.aicte_permanent_id if case.institution else None,
        current_category=case.category,
    )
    suggestion = compute_triage_suggestion(db, req)
    return StandardResponse(data=suggestion, success=True)


@router.post(
    "/triage/apply",
    response_model=StandardResponse[TriageApplyResponse],
    summary="Human-in-the-Loop decision gate: apply triage recommendation to case"
)
def apply_triage(
    request: TriageApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER)),
):
    """
    Strict Human-in-the-Loop Gate (AI-04):
    Updates case bureau, category, and priority upon explicit officer confirmation,
    recording an immutable CaseAuditEvent tracking the human approval.
    """
    try:
        response = apply_triage_suggestion(db, request, actor_email=current_user.email)
        return StandardResponse(data=response, success=True)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply triage recommendation: {str(e)}"
        )
