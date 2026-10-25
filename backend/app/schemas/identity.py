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


class ComplainantTimelineItem(BaseModel):
    timestamp: datetime
    event_type: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    remarks: Optional[str] = None


class ComplainantCaseAttachment(BaseModel):
    id: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    secure_url: str
    category: str
    description: Optional[str] = None
    created_at: datetime


class ComplainantCaseDetail(BaseModel):
    id: str
    case_reference_id: str
    subject: str
    description_redacted: str
    category: str
    priority: str
    status: str
    institution_name: str
    aicte_permanent_id: Optional[str] = None
    bureau_code: str
    bureau_name: str
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closure_remarks: Optional[str] = None
    is_awaiting_information: bool
    attachments: list[ComplainantCaseAttachment] = []
    timeline: list[ComplainantTimelineItem] = []


class ComplainantPortalResponse(BaseModel):
    complainant: VerifiedComplainantToken
    cases: list[ComplainantCaseDetail]
    active_count: int
    action_required_count: int
    resolved_count: int


class ComplainantUploadResponse(BaseModel):
    attachment: ComplainantCaseAttachment
    case_reference_id: str
    new_status: str
    message: str
