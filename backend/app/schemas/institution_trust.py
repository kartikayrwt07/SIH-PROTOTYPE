"""
Pydantic Schemas for Institution Dynamic Trust / Credit Score.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, model_validator
from backend.app.schemas.analytics import RecurringCategoryCount


class InstitutionOption(BaseModel):
    id: str
    aicte_permanent_id: str
    name: str
    state: str
    district: str
    institution_type: Optional[str] = "Private"

    model_config = ConfigDict(from_attributes=True)


class DeductionBreakdown(BaseModel):
    sla_breaches_count: int = Field(0, description="Total overdue SLA breaches")
    sla_breach_points: int = Field(0, description="Points deducted for SLA breaches (e.g. -45/case)")
    
    approaching_warnings_count: int = Field(0, description="Total cases nearing deadline")
    approaching_warning_points: int = Field(0, description="Points deducted for deadline warnings (-15/case)")
    
    severe_complaints_count: int = Field(0, description="Total critical/urgent severity cases")
    severe_complaint_points: int = Field(0, description="Points deducted for severe verified cases (-30 to -50/case)")
    
    sensitive_category_count: int = Field(0, description="Severe categories (Ragging, Harassment, Fee Extortion, Fake Faculty)")
    sensitive_category_points: int = Field(0, description="Multiplier penalty points for high-sensitivity categories")
    
    master_ticket_clusters_count: int = Field(0, description="Systemic repeat clusters / mass student unrest")
    master_ticket_points: int = Field(0, description="Points deducted for mass duplicate clusters (-60/cluster)")
    
    backlog_dwell_count: int = Field(0, description="Unresolved cases lingering > 30 days")
    backlog_dwell_points: int = Field(0, description="Points deducted for long-dwell backlog (-20/case)")
    
    recovery_bonus_points: int = Field(0, description="Points awarded for prompt resolution & high velocity")
    total_deductions: int = Field(0, description="Net points subtracted from 1000 base score")


class CaseDeductionCitation(BaseModel):
    case_reference_id: str
    subject: str
    category: str
    priority: str
    status: str
    points_deducted: int
    deduction_reason: str
    created_at: str


class InstitutionTrustScoreDetail(BaseModel):
    institution_id: str
    aicte_permanent_id: str
    name: str
    state: str
    district: str
    institution_type: str
    
    # Dynamic Credit Score
    trust_score: int = Field(..., ge=0, le=1000, description="Dynamic Credit Score out of 1000")
    base_score: int = Field(1000, description="Standard pristine starting score")
    trust_grade: str = Field(..., description="AAA, AA, A-, BBB, B, or C")
    risk_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    risk_tier: str = Field(..., description="Tier 1 (Exemplary) through Tier 6 (Critical Red Zone)")
    trend: str = Field("stable", description="'improving' | 'stable' | 'deteriorating'")
    
    # Case Metrics
    total_cases: int
    open_cases: int
    resolved_cases: int
    overdue_cases: int
    resolution_rate_pct: float
    top_recurring_categories: List[RecurringCategoryCount]
    
    # Detailed Deduction Ledger
    deduction_breakdown: DeductionBreakdown
    citations: List[CaseDeductionCitation] = Field(default_factory=list)
    
    # Automated Regulatory Oversight Directives
    automated_directive: str = Field(..., description="Automated regulatory recommendation")
    recommended_action_code: str = Field(
        ...,
        description="'MANDATORY_INSPECTION_FREEZE' | 'SHOW_CAUSE_SUMMONS' | 'HEIGHTENED_MONITORING' | 'ROUTINE_COMPLIANCE'"
    )
    last_audit_date: str
    pdf_notice_url: Optional[str] = Field(None, description="Direct download URL for legal Show-Cause or Freeze Notice PDF")

    model_config = ConfigDict(from_attributes=True)


class TrustLeaderboardSummary(BaseModel):
    national_average_score: float
    total_institutions: int
    critical_risk_count: int     # Score < 400
    high_risk_count: int         # Score 400 - 549
    watchlist_count: int         # Score 550 - 699
    compliant_count: int         # Score >= 700
    total_sla_breaches: int
    total_penalties_deducted: int


class RegulatoryActionRequest(BaseModel):
    action_type: Optional[str] = Field(None, description="'SHOW_CAUSE_NOTICE' | 'FREEZE_INTAKE' | 'SCHEDULE_INSPECTION' | 'DISMISS_ALERT' | 'SHOW_CAUSE_SUMMONS' | 'MANDATORY_INSPECTION_FREEZE' | 'HEIGHTENED_MONITORING' | 'ROUTINE_COMPLIANCE'")
    action_code: Optional[str] = Field(None, description="Frontend alias for action_type")
    directive_notes: Optional[str] = Field(None, description="Detailed directive notes")
    summary: Optional[str] = Field(None, description="Frontend alias for directive_notes")
    authorized_by: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            act = data.get("action_type") or data.get("action_code") or "SHOW_CAUSE_NOTICE"
            notes = data.get("directive_notes") or data.get("summary") or "Regulatory action dispatched."
            data["action_type"] = act
            data["action_code"] = act
            data["directive_notes"] = notes
            data["summary"] = notes
        return data


class RegulatoryActionResponse(BaseModel):
    success: bool = True
    institution_id: str
    action_type: str
    action_code: Optional[str] = None
    action_id: Optional[str] = None
    status: str = "DISPATCHED"
    reference_number: str
    dispatch_reference: Optional[str] = None
    issued_at: str
    dispatched_at: Optional[str] = None
    message: str
    summary: Optional[str] = None
    pdf_download_url: Optional[str] = Field(None, description="Direct download URL for the generated legal PDF notice")
