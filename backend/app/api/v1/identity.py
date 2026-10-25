"""
FastAPI Endpoints for Complainant Identity Verification,
OTP Challenges, and Whistleblower Privacy Vault.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user
from backend.app.models.user import User, UserRole
from backend.app.models.identity import ComplainantIdentity
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.identity import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifiedComplainantToken,
    ComplainantPublicBadge,
    ComplainantPortalResponse,
    ComplainantUploadResponse,
)
from backend.app.services.identity import (
    initiate_otp_challenge,
    verify_otp_challenge,
    resolve_verified_identity,
    get_complainant_portal_data,
    upload_complainant_case_document,
)

router = APIRouter(prefix="/identity", tags=["Complainant Identity Verification"])


@router.post(
    "/otp/send",
    response_model=StandardResponse[SendOtpResponse],
    summary="Dispatch 2FA OTP / Aadhaar VID verification challenge"
)
def send_verification_otp(
    request: SendOtpRequest,
    db: Session = Depends(get_db),
):
    """
    Sends a time-bound verification challenge to the provided phone or email target.
    In development and sandbox modes, provides pre-filled OTP for immediate verification.
    """
    try:
        response = initiate_otp_challenge(db, request)
        return StandardResponse(data=response, success=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to dispatch verification challenge: {str(e)}"
        )


@router.post(
    "/otp/verify",
    response_model=StandardResponse[VerifiedComplainantToken],
    summary="Verify OTP challenge and generate Complainant Verification Token"
)
def verify_otp(
    request: VerifyOtpRequest,
    db: Session = Depends(get_db),
):
    """
    Validates the 6-digit OTP code against the challenge transaction.
    Returns a signed verification token that permits grievance submission.
    """
    try:
        token_data = verify_otp_challenge(db, request)
        return StandardResponse(data=token_data, success=True)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification validation error: {str(e)}"
        )


@router.get(
    "/verify-token",
    response_model=StandardResponse[ComplainantPublicBadge],
    summary="Inspect status of a verification token"
)
def check_verification_token(
    x_complainant_token: str = Header(..., alias="X-Complainant-Token"),
    db: Session = Depends(get_db),
):
    """Validates whether an active verification token is valid and unexpired."""
    identity = resolve_verified_identity(db, x_complainant_token)
    if not identity:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired complainant verification certificate."
        )

    badge = ComplainantPublicBadge(
        complainant_type=identity.complainant_type,
        masked_identifier=identity.masked_identifier,
        is_verified=identity.is_verified,
        verification_method=identity.verification_method,
        verified_at=identity.verified_at,
    )
    return StandardResponse(data=badge, success=True)


def get_complainant_identity(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_complainant_token: Optional[str] = Header(None, alias="X-Complainant-Token"),
    db: Session = Depends(get_db),
) -> ComplainantIdentity:
    token = x_complainant_token or authorization
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Complainant authentication required. Please provide X-Complainant-Token or Authorization Bearer header."
        )
    identity = resolve_verified_identity(db, token)
    if not identity:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired complainant session. Please verify with OTP again."
        )
    return identity


@router.get(
    "/my-cases",
    response_model=StandardResponse[ComplainantPortalResponse],
    summary="Fetch complainant's active and resolved grievances with real-time status"
)
def get_my_cases(
    identity: ComplainantIdentity = Depends(get_complainant_identity),
    db: Session = Depends(get_db),
):
    """
    Returns the confidential dashboard view for a verified complainant.
    Lists all grievances filed under their identity, real-time stage, SLA due dates,
    and action flags for 'Awaiting Information' cases.
    """
    data = get_complainant_portal_data(db, identity)
    return StandardResponse(data=data, success=True)


@router.post(
    "/cases/{case_ref}/upload",
    response_model=StandardResponse[ComplainantUploadResponse],
    summary="Securely upload requested documents for a grievance ticket in Awaiting Information state"
)
async def upload_document_for_case(
    case_ref: str,
    request: Request,
    identity: ComplainantIdentity = Depends(get_complainant_identity),
    db: Session = Depends(get_db),
):
    """
    Permits verified complainants to securely upload requested evidentiary documents
    (fee receipts, university communications, medical records) directly to their grievance dossier.
    Automatically advances status from 'Awaiting Information' back to 'In Progress' for desk officer review.
    """
    form = await request.form()
    file = form.get("file")
    if not file or not hasattr(file, "read"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multipart upload missing 'file' payload."
        )

    file_bytes = await file.read()
    file_name = getattr(file, "filename", None) or "student_evidence.pdf"
    content_type = getattr(file, "content_type", None) or "application/octet-stream"
    description = form.get("description", None)

    result = upload_complainant_case_document(
        db=db,
        identity=identity,
        case_ref=case_ref,
        file_name=file_name,
        file_bytes=file_bytes,
        mime_type=content_type,
        description=description,
    )
    return StandardResponse(data=result, success=True)
