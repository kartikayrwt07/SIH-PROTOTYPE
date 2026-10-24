from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user
from backend.app.models.user import User, UserRole
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.analytics import (
    DashboardOverview,
    BottleneckAnalysis,
    BureauWorkloadStat,
    InstitutionPerformanceStat,
)
from backend.app.services.analytics import (
    get_dashboard_overview,
    compute_lifecycle_dwell_times,
    get_bureau_workload_breakdown,
    get_institution_performance_stats,
)

router = APIRouter(prefix="/dashboard")


@router.get("/metrics", response_model=StandardResponse[DashboardOverview])
def get_dashboard_metrics(
    bureau_id: Optional[str] = Query(None, description="Filter metrics by AICTE Bureau"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve aggregate executive KPIs, bureau workload breakdown, and status distributions."""
    # Data scoping: Bureau Officers & Auditors with bureau assignment are scoped to their cell
    effective_bureau_id = bureau_id
    if current_user.role in [UserRole.OFFICER, UserRole.AUDITOR] and current_user.bureau_id:
        effective_bureau_id = current_user.bureau_id

    overview = get_dashboard_overview(db, bureau_id=effective_bureau_id)
    return StandardResponse(data=overview)


@router.get("/bottlenecks", response_model=StandardResponse[BottleneckAnalysis])
def get_bottleneck_analysis(
    bureau_id: Optional[str] = Query(None, description="Filter dwell times by Bureau"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve lifecycle stage dwell-time latency metrics and operational bottleneck detection."""
    effective_bureau_id = bureau_id
    if current_user.role in [UserRole.OFFICER, UserRole.AUDITOR] and current_user.bureau_id:
        effective_bureau_id = current_user.bureau_id

    analysis = compute_lifecycle_dwell_times(db, bureau_id=effective_bureau_id)
    return StandardResponse(data=analysis)


@router.get("/workload", response_model=StandardResponse[List[BureauWorkloadStat]])
def get_bureau_workload(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve non-toxic cross-bureau volume comparison and resolution velocity."""
    stats = get_bureau_workload_breakdown(db)
    return StandardResponse(data=stats)


@router.get("/institutions", response_model=StandardResponse[List[InstitutionPerformanceStat]])
def get_institution_performance(
    state: Optional[str] = Query(None, description="Filter institutions by state jurisdiction"),
    intervention_status: Optional[str] = Query(None, description="Filter by regulatory intervention status: CRITICAL_INTERVENTION, WATCHLIST, COMPLIANT"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve comparative performance league table across technical institutions.
    Ranks institutions by overdue SLA breaches, pending complaints, and identifies
    recurring grievance themes to flag regulatory intervention hotspots.
    """
    stats = get_institution_performance_stats(
        db,
        state=state,
        intervention_status=intervention_status,
    )
    return StandardResponse(data=stats)
