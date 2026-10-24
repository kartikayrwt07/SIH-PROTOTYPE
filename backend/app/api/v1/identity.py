"""
FastAPI Endpoints for Complainant Identity Verification,
OTP Challenges, and Whistleblower Privacy Vault.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.core.database import get_db
from backend.app.core.auth import get_current_user
from backend.app.models.user import User, UserRole
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.identity import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifiedComplainantToken,
    ComplainantPublicBadge,
)
from backend.app.services.identity import (
    initiate_otp_challenge,
    verify_otp_challenge,
    resolve_verified_identity,
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
