from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from backend.app.models.identity import VerificationMethod, ComplainantType


class SendOtpRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Legal full name of complainant")
    target: str = Field(..., min_length=10, max_length=150, description="Mobile number (10-digits) or Email address")
    method: VerificationMethod = Field(default=VerificationMethod.MOBILE_EMAIL_2FA, description="Selected verification channel")
    complainant_type: ComplainantType = Field(default=ComplainantType.STUDENT, description="Affiliation type")


class SendOtpResponse(BaseModel):
    tx_ref: str
    target_masked: str
    expires_in_seconds: int
    message: str
    sandbox_otp: Optional[str] = None  # Returned in sandbox/demo mode for easy judging


class VerifyOtpRequest(BaseModel):
    tx_ref: str
    otp_code: str = Field(..., min_length=6, max_length=6)


class VerifiedComplainantToken(BaseModel):
    verification_token: str
    complainant_id: str
    masked_identifier: str
    full_name: str
    complainant_type: ComplainantType
    verification_method: VerificationMethod
    verified_at: datetime
    is_whistleblower_shielded: bool = True


class ComplainantPublicBadge(BaseModel):
    complainant_type: ComplainantType
    masked_identifier: str
    is_verified: bool
    verification_method: VerificationMethod
    verified_at: Optional[datetime] = None
