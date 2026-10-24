from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict


class BureauWorkloadStat(BaseModel):
    bureau_id: str
    bureau_code: str
    bureau_name: str
    total_cases: int
    open_cases: int
    overdue_cases: int
    approaching_cases: int
    resolved_cases: int
    rejected_cases: int = 0
    resolution_rate_pct: float
    avg_resolution_hours: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class StageDwellTimeStat(BaseModel):
    stage: str
    count: int
    avg_hours: float
    avg_days: float
    min_hours: float
    max_hours: float
    is_bottleneck: bool

    model_config = ConfigDict(from_attributes=True)


class ExecutiveKPIs(BaseModel):
    total_cases: int
    open_cases: int
    pending_action: int
    approaching_deadline: int
    overdue_cases: int
    resolved_closed: int
    resolution_rate_pct: float
    rejected_spam_cases: int = 0
    avg_resolution_hours: float = 0.0
    avg_resolution_days: float = 0.0


class DashboardOverview(BaseModel):
    kpis: ExecutiveKPIs
    by_bureau: List[BureauWorkloadStat]
    by_status: Dict[str, int]
    by_priority: Dict[str, int]
    by_category: Dict[str, int]


class BottleneckAnalysis(BaseModel):
    stages: List[StageDwellTimeStat]
    primary_bottleneck_stage: Optional[str] = None
    system_health_status: str
    operational_advisory: Optional[str] = None


class RecurringCategoryCount(BaseModel):
    category: str
    count: int


class InstitutionPerformanceStat(BaseModel):
    institution_id: str
    aicte_permanent_id: str
    name: str
    state: str
    district: str
    institution_type: str
    total_cases: int
    open_cases: int
    pending_cases: int
    resolved_cases: int
    overdue_cases: int
    approaching_cases: int
    resolution_rate_pct: float
    top_recurring_categories: List[RecurringCategoryCount]
    intervention_status: str  # "CRITICAL_INTERVENTION", "WATCHLIST", "COMPLIANT"
    trust_score: int = 1000  # Dynamic Credit Score out of 1000
    trust_grade: str = "AAA"  # AAA, AA, A-, BBB, B, C
    risk_level: str = "LOW"  # LOW, MODERATE, HIGH, CRITICAL
    automated_directive: str = "Standard Annual EOA Compliance Verification"
    sla_penalty_points: int = 0
    severe_penalty_points: int = 0

    model_config = ConfigDict(from_attributes=True)
