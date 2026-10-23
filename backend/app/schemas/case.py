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


class ComplaintCaseRead(BaseModel):
    id: str
    case_reference_id: str
    institution_id: str
    bureau_id: str
    assigned_officer_id: Optional[str] = None
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
