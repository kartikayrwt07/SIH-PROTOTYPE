"""
Pydantic v2 schemas for Smart Duplicate Grouping / Master Ticket operations.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.master_ticket import MasterTicketStatus


# ---------- Child case summary ----------
class MasterTicketChildRead(BaseModel):
    id: str
    case_id: str
    case_reference_id: str = ""
    subject: str = ""
    status: str = ""
    similarity_score: float
    linked_at: datetime
    is_anchor: bool

    model_config = ConfigDict(from_attributes=True)


# ---------- Master Ticket read ----------
class MasterTicketRead(BaseModel):
    id: str
    ticket_reference_id: str
    institution_id: str
    institution_name: str = ""
    institution_aicte_id: str = ""
    bureau_id: str
    bureau_code: str = ""
    bureau_name: str = ""
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None

    consolidated_subject: str
    consolidated_description: str
    category: str
    common_grievance_theme: Optional[str] = None

    child_count: int
    similarity_threshold: float
    avg_similarity_score: float

    status: MasterTicketStatus
    resolution_remarks: Optional[str] = None
    time_saved_hours: float

    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    children: List[MasterTicketChildRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ---------- Master Ticket summary (list view) ----------
class MasterTicketSummary(BaseModel):
    id: str
    ticket_reference_id: str
    institution_name: str = ""
    bureau_code: str = ""
    bureau_name: str = ""
    consolidated_subject: str
    category: str
    child_count: int
    avg_similarity_score: float
    status: MasterTicketStatus
    time_saved_hours: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Auto-detect request ----------
class AutoDetectDuplicateGroupRequest(BaseModel):
    institution_aicte_id: Optional[str] = Field(None, description="Narrow grouping to a specific institution")
    category: Optional[str] = Field(None, description="Narrow grouping to a specific category")
    similarity_threshold: float = Field(0.78, ge=0.5, le=1.0, description="Cosine similarity threshold for grouping")
    min_group_size: int = Field(3, ge=2, le=100, description="Minimum complaints required to form a master ticket")


AutoDetectRequest = AutoDetectDuplicateGroupRequest


class DetectedGroup(BaseModel):
    anchor_case_reference_id: str
    anchor_subject: str
    institution_name: str
    institution_aicte_id: str
    bureau_code: str
    bureau_name: str
    category: str
    member_count: int
    avg_similarity: float
    member_case_refs: List[str]
    common_keywords: List[str]


class AutoDetectResponse(BaseModel):
    total_cases_scanned: int
    groups_detected: int
    total_groupable_cases: int
    estimated_time_saved_hours: float
    groups: List[DetectedGroup]


# ---------- Create master ticket from detected group ----------
class CreateMasterTicketRequest(BaseModel):
    case_reference_ids: List[str] = Field(..., min_length=2, description="Case reference IDs to group")
    consolidated_subject: Optional[str] = Field(None, description="Optional override subject (auto-generated if omitted)")
    resolution_remarks: Optional[str] = Field(None, description="Optional initial resolution notes")


class CreateMasterTicketResponse(BaseModel):
    ticket_reference_id: str
    child_count: int
    institution_name: str
    category: str
    avg_similarity_score: float
    time_saved_hours: float
    message: str


# ---------- Resolve master ticket ----------
class ResolveMasterTicketRequest(BaseModel):
    resolution_remarks: str = Field(..., min_length=5, description="Resolution details to propagate to all child complaints")
    child_status: str = Field("Resolved", description="Target status for child cases")


class ResolveMasterTicketResponse(BaseModel):
    ticket_reference_id: str
    children_resolved: int
    children_already_resolved: int
    total_time_saved_hours: float
    resolution_remarks: str
    resolved_at: datetime


# ---------- Dashboard stats ----------
class MasterTicketStats(BaseModel):
    total_master_tickets: int
    open_tickets: int
    resolved_tickets: int
    total_children_grouped: int
    total_time_saved_hours: float
    avg_group_size: float
    largest_group_size: int
    top_categories: List[dict] = Field(default_factory=list)
