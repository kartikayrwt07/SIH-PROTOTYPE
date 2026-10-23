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
    resolution_rate_pct: float

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
