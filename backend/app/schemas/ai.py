"""
Pydantic v2 schemas for Explainable AI Intelligence, Duplicate Detection,
and Smart Bureau Triage Recommendations.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DuplicateMatch(BaseModel):
    case_reference_id: str = Field(..., description="Unique case reference ID of candidate match")
    subject: str = Field(..., description="Subject of matching case")
    institution_name: str = Field(..., description="Name of institution")
    institution_aicte_id: str = Field(..., description="AICTE permanent ID of institution")
    bureau_code: str = Field(..., description="Assigned bureau code (e.g. BUR-APPR)")
    bureau_name: str = Field(..., description="Assigned bureau name")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score (0.0 to 1.0)")
    matched_keywords: List[str] = Field(default_factory=list, description="Overlapping salient n-grams/keywords")
    status: str = Field(..., description="Current lifecycle state of the candidate match")
    created_at: datetime = Field(..., description="Submission date of candidate match")


class DuplicateCheckRequest(BaseModel):
    subject: str = Field(..., min_length=3, description="Complaint subject to check for duplicates")
    description: str = Field(..., min_length=10, description="Grievance narrative")
    institution_aicte_id: Optional[str] = Field(None, description="Optional AICTE ID to boost institutional affinity")
    exclude_case_ref: Optional[str] = Field(None, description="Case reference to exclude (e.g. self-comparison)")
    threshold: float = Field(0.35, ge=0.1, le=1.0, description="Minimum similarity score threshold")


class DuplicateCheckResponse(BaseModel):
    total_evaluated: int = Field(..., description="Total active complaint cases compared against")
    matches_found: int = Field(..., description="Number of candidate duplicates exceeding threshold")
    highest_similarity: float = Field(0.0, ge=0.0, le=1.0, description="Maximum similarity score found")
    has_potential_duplicate: bool = Field(..., description="True if one or more candidates exceed threshold")
    matches: List[DuplicateMatch] = Field(default_factory=list, description="Ranked list of candidate duplicate matches")


class TriageRationaleItem(BaseModel):
    category: str = Field(..., description="Rationale dimension (KEYWORD_AFFINITY, INSTITUTION_HISTORY, DOMAIN_POLICY)")
    title: str = Field(..., description="Short factor description")
    explanation: str = Field(..., description="Human-readable transparent justification")
    weight: float = Field(..., ge=0.0, le=1.0, description="Contribution weight to overall confidence")
    matched_tokens: List[str] = Field(default_factory=list, description="Extracted domain keywords supporting this factor")


class TriageSuggestRequest(BaseModel):
    subject: str = Field(..., min_length=3, description="Complaint subject")
    description: str = Field(..., min_length=10, description="Complaint narrative")
    institution_aicte_id: Optional[str] = Field(None, description="Optional AICTE Institution ID")
    current_category: Optional[str] = Field(None, description="Existing category if assigned")


class TriageSuggestion(BaseModel):
    recommended_bureau_id: str = Field(..., description="Primary suggested bureau UUID")
    recommended_bureau_code: str = Field(..., description="Suggested bureau code (e.g. BUR-RAGG)")
    recommended_bureau_name: str = Field(..., description="Suggested bureau display name")
    recommended_category: str = Field(..., description="Suggested AICTE grievance category")
    recommended_priority: str = Field(..., description="Suggested initial case priority")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Calculated confidence score (0.0 to 1.0)")
    rationales: List[TriageRationaleItem] = Field(default_factory=list, description="Transparent explainability factors")


class TriageApplyRequest(BaseModel):
    case_reference_id: str = Field(..., description="Target case reference to update")
    bureau_id: Optional[str] = Field(None, description="Bureau ID to assign")
    category: Optional[str] = Field(None, description="Grievance category to apply")
    priority: Optional[str] = Field(None, description="Priority to update")
    justification: Optional[str] = Field("Accepted explainable AI triage recommendation", description="Audit justification")


class TriageApplyResponse(BaseModel):
    case_reference_id: str
    bureau_code: str
    bureau_name: str
    category: str
    priority: str
    status: str
    audit_event_id: str
    applied_at: datetime
