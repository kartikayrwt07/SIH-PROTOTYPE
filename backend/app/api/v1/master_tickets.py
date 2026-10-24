"""
FastAPI Endpoints for Smart Duplicate Grouping / Master Ticket operations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user, require_roles
from backend.app.models.user import User, UserRole
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.master_ticket import (
    AutoDetectDuplicateGroupRequest,
    AutoDetectResponse,
    CreateMasterTicketRequest,
    CreateMasterTicketResponse,
    ResolveMasterTicketRequest,
    ResolveMasterTicketResponse,
    MasterTicketRead,
    MasterTicketSummary,
    MasterTicketStats,
)
from backend.app.services.duplicate_grouping import (
    auto_detect_duplicate_groups,
    create_master_ticket,
    resolve_master_ticket,
    get_master_ticket_detail,
    list_master_tickets,
    get_master_ticket_stats,
)

router = APIRouter()


@router.post(
    "/detect",
    response_model=StandardResponse[AutoDetectResponse],
    summary="Auto-detect clusters of duplicate complaints suitable for Master Ticket grouping",
)
def detect_duplicate_groups(
    request: AutoDetectDuplicateGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Scans active complaint cases using dense semantic similarity to identify
    clusters from the same institution+category that can be grouped into
    Master Tickets for bulk resolution.
    """
    try:
        result = auto_detect_duplicate_groups(db, request)
        return StandardResponse(data=result, success=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Duplicate group detection failed: {str(e)}",
        )


@router.post(
    "/create",
    response_model=StandardResponse[CreateMasterTicketResponse],
    summary="Create a Master Ticket from a set of related complaint cases",
)
def create_master_ticket_endpoint(
    request: CreateMasterTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER)),
):
    """
    Groups specified complaint cases into a single Master Ticket.
    Resolving this master ticket will cascade status updates to all linked complaints.
    """
    try:
        result = create_master_ticket(db, request, actor=current_user)
        return StandardResponse(data=result, success=True)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Master ticket creation failed: {str(e)}",
        )


@router.post(
    "/{ticket_ref}/resolve",
    response_model=StandardResponse[ResolveMasterTicketResponse],
    summary="Resolve a Master Ticket and cascade resolution to all linked child complaints",
)
def resolve_master_ticket_endpoint(
    ticket_ref: str,
    request: ResolveMasterTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER)),
):
    """
    Resolves the master ticket and propagates the resolution status and remarks
    to every linked child complaint case. This is the key administrative time-saving
    operation: one action resolves N complaints simultaneously.
    """
    try:
        result = resolve_master_ticket(db, ticket_ref, request, actor=current_user)
        return StandardResponse(data=result, success=True)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Master ticket resolution failed: {str(e)}",
        )


@router.get(
    "",
    response_model=StandardResponse[List[MasterTicketSummary]],
    summary="List all Master Tickets with optional filtering",
)
@router.get(
    "/",
    response_model=StandardResponse[List[MasterTicketSummary]],
    include_in_schema=False,
)
@router.get(
    "/list",
    response_model=StandardResponse[List[MasterTicketSummary]],
    include_in_schema=False,
)
def list_master_tickets_endpoint(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by Master Ticket status"),
    bureau_id: Optional[str] = Query(None, description="Filter by Bureau ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all master tickets with bureau/status filtering."""
    tickets = list_master_tickets(db, status_filter=status_filter, bureau_id=bureau_id)
    return StandardResponse(data=tickets, success=True)


@router.get(
    "/stats",
    response_model=StandardResponse[MasterTicketStats],
    summary="Master Ticket dashboard statistics and time-savings analytics",
)
def get_master_ticket_stats_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns aggregated statistics: total tickets, time saved, group sizes, top categories."""
    stats = get_master_ticket_stats(db)
    return StandardResponse(data=stats, success=True)


@router.get(
    "/{ticket_ref}",
    response_model=StandardResponse[MasterTicketRead],
    summary="Retrieve full Master Ticket detail with linked child cases",
)
def get_master_ticket_detail_endpoint(
    ticket_ref: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves complete master ticket detail including all linked child complaint cases."""
    try:
        detail = get_master_ticket_detail(db, ticket_ref)
        return StandardResponse(data=detail, success=True)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
