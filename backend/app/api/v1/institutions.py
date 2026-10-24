"""
API Endpoints for Institution Dynamic Trust Score & Super Admin High-Risk Leaderboard.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user, require_roles
from backend.app.models.user import User, UserRole
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.institution_trust import (
    InstitutionTrustScoreDetail,
    TrustLeaderboardSummary,
    RegulatoryActionRequest,
    RegulatoryActionResponse,
    InstitutionOption,
)
from backend.app.models.institution import Institution
from backend.app.services.institution_trust import (
    get_trust_score_leaderboard,
    get_institution_trust_detail,
    execute_regulatory_action,
)

router = APIRouter()


@router.get(
    "/all",
    response_model=StandardResponse[List[InstitutionOption]],
    summary="List all technical institutions for dashboard filter dropdowns",
)
def get_all_institutions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all active technical colleges for UI selector dropdowns."""
    institutions = db.query(Institution).filter(Institution.is_active == True).order_by(Institution.name).all()
    return StandardResponse(data=institutions)


@router.get(
    "/trust-scores",
    response_model=StandardResponse[List[InstitutionTrustScoreDetail]],
    summary="High-Risk Institution Leaderboard (Worst-Performing Colleges First)",
)
def get_institution_trust_scores(
    sort_order: str = Query(
        "worst_first",
        description="Sort ordering: 'worst_first' (high-risk leaderboard) or 'best_first'",
    ),
    state: Optional[str] = Query(None, description="Filter by state jurisdiction"),
    risk_level: Optional[str] = Query(
        None,
        description="Filter by risk level: CRITICAL, HIGH, MODERATE, LOW",
    ),
    limit: int = Query(50, ge=1, le=200, description="Maximum institutions to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves ranked institutions by dynamic credit score out of 1000.
    Super Admins and Officers can monitor the worst-performing technical colleges,
    overdue SLA breaches, severe complaints, and automated regulatory directives.
    """
    institutions, _ = get_trust_score_leaderboard(
        db=db,
        sort_order=sort_order,
        state=state,
        risk_level=risk_level,
        limit=limit,
    )
    return StandardResponse(data=institutions)


@router.get(
    "/trust-scores/summary",
    response_model=StandardResponse[TrustLeaderboardSummary],
    summary="National Trust & Risk Analytics Summary",
)
def get_trust_scores_summary(
    state: Optional[str] = Query(None, description="Filter by state jurisdiction"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Provides national aggregate metrics on college credit scores:
    National Average Score, Critical Red Zone count, Total SLA breaches, and Total Deductions.
    """
    _, summary = get_trust_score_leaderboard(
        db=db,
        sort_order="worst_first",
        state=state,
        limit=500,
    )
    return StandardResponse(data=summary)


@router.get(
    "/{institution_id}/trust-score",
    response_model=StandardResponse[InstitutionTrustScoreDetail],
    summary="Detailed Institution Trust Score Dossier & Deduction Ledger",
)
def get_institution_trust_score_by_id(
    institution_id: str = Path(..., description="Institution UUID or AICTE Permanent ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns an itemized credit score audit report for a single institution,
    including mathematical penalty deductions for each specific complaint and SLA breach.
    """
    detail = get_institution_trust_detail(institution_id, db)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID or AICTE ID '{institution_id}' not found",
        )
    return StandardResponse(data=detail)


@router.post(
    "/{institution_id}/action",
    response_model=StandardResponse[RegulatoryActionResponse],
    summary="Execute Automated Regulatory Oversight Action",
)
def post_regulatory_action(
    institution_id: str = Path(..., description="Target Institution UUID"),
    request: RegulatoryActionRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Executes a formal AICTE regulatory action triggered from the High-Risk Leaderboard:
    Dispatches Show-Cause Notice, orders intake quota freeze, or schedules inspection.
    Restricted to SUPER_ADMIN, ADMIN, or BUREAU_HEAD.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators or Central Supervisors may execute regulatory oversight sanctions.",
        )

    try:
        response = execute_regulatory_action(
            institution_id=institution_id,
            action=request,
            db=db,
        )
        return StandardResponse(data=response)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
