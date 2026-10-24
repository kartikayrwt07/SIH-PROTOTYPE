from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.case import CaseStatus
from backend.app.models.sla import CasePriority
from backend.app.schemas.bureau import BureauRead


class InstitutionRead(BaseModel):
    id: str
    aicte_permanent_id: str
    name: str
    state: str
    district: str
    institution_type: str

    model_config = ConfigDict(from_attributes=True)


class UserSummary(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class ComplaintCaseBase(BaseModel):
    subject: str
    category: str
    priority: CasePriority = CasePriority.MEDIUM
    description_redacted: str
    description_confidential: Optional[str] = None


class ComplaintCaseCreate(ComplaintCaseBase):
    institution_id: str
    bureau_id: str
    verification_token: Optional[str] = Field(None, description="Signed complainant e-KYC token")


class ComplaintCaseRead(BaseModel):
    id: str
    case_reference_id: str
    institution_id: str
    bureau_id: str
    assigned_officer_id: Optional[str] = None
    complainant_identity_id: Optional[str] = None
    complainant_verification_badge: Optional[dict] = None
    subject: str
    description_redacted: str
    description_confidential: Optional[str] = None
    category: str
    priority: CasePriority
    status: CaseStatus
    due_date: Optional[datetime] = None
    escalation_level: int
    closure_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    original_language: Optional[str] = "en"
    original_description: Optional[str] = None
    translation_provider: Optional[str] = None

    institution: Optional[InstitutionRead] = None
    bureau: Optional[BureauRead] = None
    assigned_officer: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class StatusTransitionRequest(BaseModel):
    to_status: CaseStatus
    remarks: str = Field(..., min_length=3, description="Mandatory remarks explaining the state transition")


class AssignmentRequest(BaseModel):
    to_bureau_id: str
    to_officer_id: Optional[str] = None
    reason: str = Field(..., min_length=3, description="Mandatory reason for assignment/transfer")


class TimelineEventRead(BaseModel):
    id: str
    case_id: str
    actor_id: Optional[str] = None
    actor_role: str
    actor_name: Optional[str] = None
    event_type: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    metadata_json: Optional[Any] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseNoteCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=5000, description="Case note body content")
    is_confidential: bool = Field(False, description="Whether this note is hidden from read-only auditors")


class CaseNoteRead(BaseModel):
    id: str
    case_id: str
    author_id: str
    content: str
    is_confidential: bool
    created_at: datetime
    author: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class CaseAssignmentHistoryRead(BaseModel):
    id: str
    case_id: str
    from_bureau_id: Optional[str] = None
    to_bureau_id: str
    assigned_by_id: Optional[str] = None
    transfer_reason: str
    created_at: datetime
    from_bureau: Optional[BureauRead] = None
    to_bureau: Optional[BureauRead] = None
    assigned_by: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class EscalateRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory reason for escalation")


class SlaRadarItem(BaseModel):
    case_reference_id: str
    subject: str
    category: str
    priority: CasePriority
    status: CaseStatus
    bureau_code: Optional[str] = None
    bureau_name: Optional[str] = None
    institution_name: Optional[str] = None
    due_date: Optional[datetime] = None
    escalation_level: int
    sla_status: str
    hours_remaining: Optional[float] = None
    is_overdue: bool


class SlaRadarSummary(BaseModel):
    total_active_cases: int
    overdue_count: int
    approaching_count: int
    on_track_count: int
    completed_count: int
    overdue_cases: List[SlaRadarItem]
    approaching_cases: List[SlaRadarItem]

