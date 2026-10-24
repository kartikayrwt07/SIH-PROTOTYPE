"""
Pydantic schemas for Magic Zero-Shot Grievance Ingestion.
"""

from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class ExtractedInstitution(BaseModel):
    name: str = Field(..., description="Extracted institution name")
    id: Optional[str] = Field(None, description="Database UUID if matched to registered institution")
    aicte_permanent_id: Optional[str] = Field(None, description="AICTE permanent ID")
    state: Optional[str] = Field(None, description="State of the institution")
    district: Optional[str] = Field(None, description="District of the institution")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score")
    is_database_match: bool = Field(..., description="True if matched to existing institution in DB")
    matched_phrase: str = Field(..., description="Substring detected in original grievance")


class CategorizationResult(BaseModel):
    category: str = Field(..., description="Detected grievance category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Categorization confidence score")
    detected_signals: List[str] = Field(default_factory=list, description="Keywords and concepts triggering this category")


class PriorityAssignment(BaseModel):
    priority: str = Field(..., description="Assigned priority (URGENT, HIGH, MEDIUM, LOW)")
    urgency_signals: List[str] = Field(default_factory=list, description="Safety or risk triggers that influenced priority")
    sla_hours: int = Field(..., description="Turnaround SLA in hours based on priority")
    rationale: str = Field(..., description="Transparent rationale explaining the priority score")


class BureauRouting(BaseModel):
    bureau_id: str = Field(..., description="Assigned bureau UUID")
    bureau_code: str = Field(..., description="Assigned bureau code (e.g. STU, FIN, APPR, FDC)")
    bureau_name: str = Field(..., description="Assigned bureau display name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Routing confidence score")
    routing_rationale: str = Field(..., description="Statutory rationale justifying autonomous bureau routing")
    all_scores: Dict[str, float] = Field(default_factory=dict, description="Affinity distribution across all bureaus")
    key_evidence_tokens: List[str] = Field(default_factory=list, description="Salient semantic tokens matched in grievance text")


class TranslationResult(BaseModel):
    source_language: str = Field(..., description="Detected language code (e.g. hi, ta, mr, en)")
    source_language_name: str = Field(..., description="Human-readable language name")
    is_translated: bool = Field(..., description="True if text was non-English and auto-translated")
    original_text: str = Field(..., description="Verbatim raw vernacular text kept as legal evidence")
    translated_text: str = Field(..., description="English translated text used for AI triage and officer review")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Language detection / translation confidence")
    provider: str = Field(..., description="Translation service provider (e.g. BHASHINI_NMT_ULCA, BHASHINI_ULCA_LIVE, DIRECT)")


class MagicAnalysisResult(BaseModel):
    extracted_college: ExtractedInstitution
    categorization: CategorizationResult
    priority_assignment: PriorityAssignment
    bureau_routing: BureauRouting
    generated_subject: str
    summary_insight: str
    translation: TranslationResult


class MagicIngestRequest(BaseModel):
    grievance_text: str = Field(..., min_length=15, description="Raw unstructured grievance narrative")
    student_name: Optional[str] = Field(None, description="Optional complainant name")
    student_email: Optional[str] = Field(None, description="Optional complainant email")
    student_phone: Optional[str] = Field(None, description="Optional complainant phone")
    institution_id: Optional[str] = Field(None, description="User-verified or overridden institution UUID")
    auto_docket: bool = Field(True, description="Whether to docket immediately into database or only analyze")


class MagicIngestResponse(BaseModel):
    analysis: MagicAnalysisResult
    case_created: bool
    case_reference_id: Optional[str] = None
    case_id: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    docket_message: str
