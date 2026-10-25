"""
Institution Dynamic Trust Score Engine (AICTE College Credit Score out of 1000).

Every technical institution starts at a baseline credit score of 1,000 points (Pristine AAA).
Real-time complaints, SLA breaches, verified severe grievances, and systemic repeat clusters
dynamically apply mathematical penalty deductions, while prompt resolutions award recovery credits.

Automates Super Admin regulatory oversight by calculating a high-risk leaderboard
of the worst-performing technical colleges and generating automated regulatory directives.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.institution import Institution
from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.master_ticket import MasterTicket
from backend.app.models.sla import CasePriority
from backend.app.services.sla import compute_case_sla_risk
from backend.app.schemas.analytics import RecurringCategoryCount
from backend.app.schemas.institution_trust import (
    DeductionBreakdown,
    CaseDeductionCitation,
    InstitutionTrustScoreDetail,
    TrustLeaderboardSummary,
    RegulatoryActionRequest,
    RegulatoryActionResponse,
)

# High-sensitivity categories that carry compounding institutional compliance risk
SENSITIVE_CATEGORIES = {
    "unauthorized fee demands": "Capitation & Unapproved Fee Demands",
    "unapproved fee": "Capitation & Unapproved Fee Demands",
    "capitation": "Illegal Capitation Fees",
    "ragging": "Anti-Ragging Regulatory Breach",
    "sexual harassment": "POSH Statutory Non-Compliance",
    "harassment": "Faculty/Student Victimization",
    "withholding certificates": "Illegal Retention of Original Educational Credentials",
    "withholding documents": "Illegal Retention of Original Educational Credentials",
    "fake faculty": "Ghost Faculty / Inflated Cadre Non-Compliance",
    "infrastructure deficiency": "Mandatory AICTE Norms Deficiency",
}


def _classify_risk_grade(score: int) -> Tuple[str, str, str, str, str]:
    """
    Maps a numeric trust score (0 - 1000) to its regulatory risk tier,
    letter grade, and automated oversight directive.
    
    Returns:
        (trust_grade, risk_level, risk_tier, automated_directive, recommended_action_code)
    """
    if score >= 850:
        return (
            "AAA",
            "LOW",
            "Tier 1 (Exemplary Trust)",
            "Institutional standing is exemplary. Eligible for Autonomous Status fast-track and EOA auto-approval.",
            "ROUTINE_COMPLIANCE",
        )
    elif score >= 700:
        return (
            "AA",
            "LOW",
            "Tier 2 (Good Standing)",
            "Grievance resolution velocity complies with AICTE benchmarks. Standard annual verification applies.",
            "ROUTINE_COMPLIANCE",
        )
    elif score >= 550:
        return (
            "A-",
            "MODERATE",
            "Tier 3 (Moderate Scrutiny)",
            "Minor SLA latency detected. Mandate quarterly institutional ombudsman report submission.",
            "HEIGHTENED_MONITORING",
        )
    elif score >= 400:
        return (
            "BBB",
            "HIGH",
            "Tier 4 (Watchlist • Warning Issued)",
            "Persistent SLA breaches and recurring student dissatisfaction. AICTE formal advisory warning issued.",
            "SHOW_CAUSE_SUMMONS",
        )
    elif score >= 250:
        return (
            "B",
            "HIGH",
            "Tier 5 (High Risk • Show-Cause Triggered)",
            "Severe regulatory failure detected. Automated Show-Cause Notice generated for Governing Board summons.",
            "SHOW_CAUSE_SUMMONS",
        )
    else:
        return (
            "C",
            "CRITICAL",
            "Tier 6 (Critical Red Zone • Sanctions)",
            "Immediate threat to student welfare. Mandatory AICTE On-Site Inspection & Academic Intake Quota Freeze Recommended.",
            "MANDATORY_INSPECTION_FREEZE",
        )


def calculate_institution_trust_score(
    institution: Institution,
    db: Session,
    now: Optional[datetime] = None,
    preloaded_cases: Optional[List[ComplaintCase]] = None,
    preloaded_master_tickets: Optional[List[MasterTicket]] = None,
) -> InstitutionTrustScoreDetail:
    """
    Dynamically computes the credit score (out of 1000) for a given technical college
    by analyzing all historical and active complaint cases, SLA performance, and repeat clusters.
    """
    now = now or datetime.now(timezone.utc)
    if preloaded_cases is not None:
        cases = preloaded_cases
    else:
        cases = (
            db.query(ComplaintCase)
            .filter(ComplaintCase.institution_id == institution.id)
            .all()
        )

    base_score = 1000
    sla_breaches_count = 0
    sla_breach_points = 0
    approaching_count = 0
    approaching_points = 0
    severe_count = 0
    severe_points = 0
    sensitive_cat_count = 0
    sensitive_cat_points = 0
    backlog_count = 0
    backlog_points = 0
    recovery_bonus = 0

    resolved_count = 0
    open_count = 0
    overdue_count = 0
    citations: List[CaseDeductionCitation] = []
    category_counts: Dict[str, int] = {}

    rejected_count = 0
    for c in cases:
        status_val = c.status.value if hasattr(c.status, "value") else str(c.status)
        if status_val == "Rejected":
            rejected_count += 1
            continue

        priority_val = c.priority.value if hasattr(c.priority, "value") else str(c.priority)
        cat = c.category or "General Grievance"
        category_counts[cat] = category_counts.get(cat, 0) + 1

        is_resolved = status_val in ["Resolved", "Closed"]
        if is_resolved:
            resolved_count += 1
        else:
            open_count += 1

        case_pts_deducted = 0
        reasons: List[str] = []

        # 1. SLA Risk Calculation
        sla_risk = compute_case_sla_risk(c, now)
        if sla_risk["status"] == "OVERDUE":
            overdue_count += 1
            sla_breaches_count += 1
            pts = 45
            sla_breach_points += pts
            case_pts_deducted += pts
            reasons.append("Overdue SLA Deadline Breach (-45 pts)")
        elif sla_risk["status"] == "APPROACHING" and not is_resolved:
            approaching_count += 1
            pts = 15
            approaching_points += pts
            case_pts_deducted += pts
            reasons.append("Approaching SLA Warning (-15 pts)")

        # 2. Priority & Severity Penalties
        if priority_val == "URGENT":
            severe_count += 1
            pts = 50
            severe_points += pts
            case_pts_deducted += pts
            reasons.append("Urgent Priority Student Grievance (-50 pts)")
        elif priority_val == "HIGH":
            severe_count += 1
            pts = 30
            severe_points += pts
            case_pts_deducted += pts
            reasons.append("High Priority Grievance (-30 pts)")

        # 3. Sensitive Category Multipliers (Ragging, Fees, POSH, Fake Staff)
        lower_cat = cat.lower()
        matched_sensitive = any(term in lower_cat for term in SENSITIVE_CATEGORIES)
        if matched_sensitive:
            sensitive_cat_count += 1
            pts = 35
            sensitive_cat_points += pts
            case_pts_deducted += pts
            reasons.append("Statutory AICTE Sensitive Category (-35 pts)")

        # 4. Long-Dwell Backlog Penalty (>30 days unresolved)
        if not is_resolved and c.created_at:
            c_created = c.created_at
            if c_created.tzinfo is None and now.tzinfo is not None:
                c_created = c_created.replace(tzinfo=timezone.utc)
            elif c_created.tzinfo is not None and now.tzinfo is None:
                c_created = c_created.replace(tzinfo=None)
            dwell_days = (now - c_created).total_seconds() / 86400.0
            if dwell_days > 30.0:
                backlog_count += 1
                pts = 20
                backlog_points += pts
                case_pts_deducted += pts
                reasons.append(f"Unresolved Backlog Lingering >30 days ({int(dwell_days)}d) (-20 pts)")

        # 5. Positive Resolution Credits
        if is_resolved:
            # Award recovery for prompt closure
            recovery_bonus += 15

        # Record citation if penalties accrued
        if case_pts_deducted > 0:
            created_str = c.created_at.strftime("%d %b %Y") if c.created_at else "Recent"
            citations.append(
                CaseDeductionCitation(
                    case_reference_id=c.case_reference_id,
                    subject=c.subject[:100],
                    category=cat,
                    priority=priority_val,
                    status=status_val,
                    points_deducted=case_pts_deducted,
                    deduction_reason="; ".join(reasons),
                    created_at=created_str,
                )
            )

    # 6. Master Ticket Clusters (Systemic repeat student complaints against the college)
    if preloaded_master_tickets is not None:
        master_tickets = preloaded_master_tickets
    else:
        master_tickets = (
            db.query(MasterTicket)
            .filter(MasterTicket.institution_id == institution.id)
            .all()
        )
    master_cluster_count = len(master_tickets)
    master_cluster_points = master_cluster_count * 60

    # 7. Additional Velocity & Clean Streak Bonuses
    total_cases = len(cases) - rejected_count
    resolution_rate = round((resolved_count / total_cases) * 100, 1) if total_cases > 0 else 100.0
    if resolution_rate >= 80.0 and total_cases >= 3:
        recovery_bonus += 40
    if overdue_count == 0 and total_cases > 0:
        recovery_bonus += 30

    # Net Deductions
    gross_deductions = (
        sla_breach_points
        + approaching_points
        + severe_points
        + sensitive_cat_points
        + master_cluster_points
        + backlog_points
    )
    net_deductions = max(0, gross_deductions - recovery_bonus)

    # Compute Final Score clamped between 50 and 1000
    final_score = max(50, min(1000, base_score - net_deductions))

    # Grade & Directive Classification
    grade, risk_level, risk_tier, directive, action_code = _classify_risk_grade(final_score)

    # Determine historical trend (based on overdue vs resolved ratio)
    if overdue_count == 0 and resolution_rate >= 75.0:
        trend = "improving"
    elif overdue_count >= 2 or resolution_rate < 40.0:
        trend = "deteriorating"
    else:
        trend = "stable"

    # Top recurring categories
    sorted_cats = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    top_recurring = [RecurringCategoryCount(category=cat, count=cnt) for cat, cnt in sorted_cats]

    deduction_breakdown = DeductionBreakdown(
        sla_breaches_count=sla_breaches_count,
        sla_breach_points=sla_breach_points,
        approaching_warnings_count=approaching_count,
        approaching_warning_points=approaching_points,
        severe_complaints_count=severe_count,
        severe_complaint_points=severe_points,
        sensitive_category_count=sensitive_cat_count,
        sensitive_category_points=sensitive_cat_points,
        master_ticket_clusters_count=master_cluster_count,
        master_ticket_points=master_cluster_points,
        backlog_dwell_count=backlog_count,
        backlog_dwell_points=backlog_points,
        recovery_bonus_points=recovery_bonus,
        total_deductions=net_deductions,
    )

    # Sort citations by points deducted descending
    citations.sort(key=lambda x: x.points_deducted, reverse=True)

    return InstitutionTrustScoreDetail(
        institution_id=institution.id,
        aicte_permanent_id=institution.aicte_permanent_id,
        name=institution.name,
        state=institution.state,
        district=institution.district,
        institution_type=institution.institution_type or "Technical Institution",
        trust_score=final_score,
        base_score=base_score,
        trust_grade=grade,
        risk_level=risk_level,
        risk_tier=risk_tier,
        trend=trend,
        total_cases=total_cases,
        open_cases=open_count,
        resolved_cases=resolved_count,
        overdue_cases=overdue_count,
        resolution_rate_pct=resolution_rate,
        top_recurring_categories=top_recurring,
        deduction_breakdown=deduction_breakdown,
        citations=citations[:10],  # Top 10 worst citations
        automated_directive=directive,
        recommended_action_code=action_code,
        last_audit_date=now.strftime("%d %b %Y"),
        pdf_notice_url=f"/api/v1/institutions/{institution.id}/regulatory-notice.pdf" if final_score < 400 else None,
    )


_LEADERBOARD_CACHE: Dict[str, Tuple[float, Any]] = {}
CACHE_TTL_SECONDS = 30.0


def get_trust_score_leaderboard(
    db: Session,
    sort_order: str = "worst_first",  # 'worst_first' (ascending score) or 'best_first' (descending score)
    state: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = 50,
) -> Tuple[List[InstitutionTrustScoreDetail], TrustLeaderboardSummary]:
    """
    Ranks technical institutions across India by their Dynamic Credit / Trust Score.
    By default, lists 'worst_first' to power the Super Admin High-Risk Regulatory Leaderboard.
    Uses batch preloading and 30s TTL caching to respond in milliseconds.
    """
    import time
    from collections import defaultdict

    cache_key = f"{sort_order}:{state}:{risk_level}:{limit}"
    now_ts = time.time()
    if cache_key in _LEADERBOARD_CACHE:
        cached_ts, cached_val = _LEADERBOARD_CACHE[cache_key]
        if now_ts - cached_ts < CACHE_TTL_SECONDS:
            return cached_val

    query = db.query(Institution).filter(Institution.is_active == True)
    if state and state.upper() != "ALL":
        query = query.filter(Institution.state.ilike(f"%{state.strip()}%"))

    institutions = query.all()

    # Batch preload all cases & master tickets in 2 single queries instead of N*2 round-trips
    all_cases = db.query(ComplaintCase).all()
    all_master_tickets = db.query(MasterTicket).all()

    cases_by_inst = defaultdict(list)
    for c in all_cases:
        cases_by_inst[c.institution_id].append(c)

    masters_by_inst = defaultdict(list)
    for m in all_master_tickets:
        masters_by_inst[m.institution_id].append(m)

    results: List[InstitutionTrustScoreDetail] = []
    now = datetime.now(timezone.utc)

    for inst in institutions:
        detail = calculate_institution_trust_score(
            inst,
            db,
            now=now,
            preloaded_cases=cases_by_inst[inst.id],
            preloaded_master_tickets=masters_by_inst[inst.id],
        )
        if risk_level and risk_level.upper() != "ALL":
            if detail.risk_level.upper() != risk_level.strip().upper():
                continue
        results.append(detail)

    # Sort leaderboard
    if sort_order == "worst_first":
        # Worst performers first: lowest trust score, highest overdue cases
        results.sort(key=lambda x: (x.trust_score, -x.overdue_cases, -x.total_cases))
    else:
        # Best performers first
        results.sort(key=lambda x: (-x.trust_score, -x.resolution_rate_pct))

    # Calculate summary metrics
    total_inst = len(results)
    avg_score = round(sum(r.trust_score for r in results) / total_inst, 1) if total_inst > 0 else 1000.0
    crit_count = sum(1 for r in results if r.trust_score < 400)
    high_count = sum(1 for r in results if 400 <= r.trust_score < 550)
    watch_count = sum(1 for r in results if 550 <= r.trust_score < 700)
    comp_count = sum(1 for r in results if r.trust_score >= 700)
    total_breaches = sum(r.overdue_cases for r in results)
    total_penalties = sum(r.deduction_breakdown.total_deductions for r in results)

    summary = TrustLeaderboardSummary(
        national_average_score=avg_score,
        total_institutions=total_inst,
        critical_risk_count=crit_count,
        high_risk_count=high_count,
        watchlist_count=watch_count,
        compliant_count=comp_count,
        total_sla_breaches=total_breaches,
        total_penalties_deducted=total_penalties,
    )

    final_results = results[:limit]
    _LEADERBOARD_CACHE[cache_key] = (now_ts, (final_results, summary))
    return final_results, summary


def get_institution_trust_detail(institution_id: str, db: Session) -> Optional[InstitutionTrustScoreDetail]:
    """Fetches in-depth credit score detail and case deduction ledger for a single institution."""
    inst = db.query(Institution).filter(
        or_(Institution.id == institution_id, Institution.aicte_permanent_id == institution_id)
    ).first()
    if not inst:
        return None
    return calculate_institution_trust_score(inst, db)


def execute_regulatory_action(
    institution_id: str,
    action: RegulatoryActionRequest,
    db: Session,
) -> RegulatoryActionResponse:
    """
    Executes an automated regulatory oversight action (e.g., dispatching formal Show-Cause Notice
    or scheduling mandatory AICTE inspection) triggered from the high-risk leaderboard.
    """
    inst = db.query(Institution).filter(
        or_(Institution.id == institution_id, Institution.aicte_permanent_id == institution_id)
    ).first()
    if not inst:
        raise ValueError(f"Institution with ID '{institution_id}' not found")

    now_ts = datetime.now(timezone.utc)
    ref_no = f"AICTE/REG/{now_ts.strftime('%Y%m')}/{inst.aicte_permanent_id}"
    issued_date = now_ts.strftime("%d %b %Y, %I:%M %p UTC")
    action_key = (action.action_type or action.action_code or "SHOW_CAUSE_NOTICE").upper()

    messages = {
        "SHOW_CAUSE_NOTICE": f"Formal Show-Cause Notice ({ref_no}) dispatched to {inst.name}. 14-day explanation response window initiated.",
        "SHOW_CAUSE_SUMMONS": f"Statutory Show-Cause Summons ({ref_no}) dispatched to Governing Board of {inst.name}. Response mandated within 14 days.",
        "FREEZE_INTAKE": f"Urgent Executive Order ({ref_no}) issued: AICTE academic intake quota freeze recommended pending inquiry.",
        "MANDATORY_INSPECTION_FREEZE": f"Executive Order ({ref_no}) issued: Mandatory AICTE inspection scheduled with academic intake freeze on {inst.name}.",
        "SCHEDULE_INSPECTION": f"Surprise On-Site AICTE Inspection Panel ({ref_no}) constituted for {inst.name}.",
        "HEIGHTENED_MONITORING": f"Heightened Regulatory Monitoring directive ({ref_no}) enacted for {inst.name}. Mandatory bi-weekly compliance filings enforced.",
        "ROUTINE_COMPLIANCE": f"Routine Compliance Directive ({ref_no}) recorded for {inst.name}. Standard verification cycle active.",
        "DISMISS_ALERT": f"Regulatory alert flagged for {inst.name} acknowledged and logged for compliance auditing.",
    }

    notes = action.directive_notes or action.summary
    default_msg = f"Regulatory action '{action_key}' ({ref_no}) dispatched to {inst.name}."
    if notes and notes != "Regulatory action dispatched.":
        default_msg += f" Terms: {notes}"
    msg = messages.get(action_key, default_msg)

    action_uuid = f"ACT-{uuid.uuid4().hex[:8].upper()}"
    pdf_url = f"/api/v1/institutions/{inst.id}/regulatory-notice.pdf?action_type={action_key}&ref={ref_no}"

    return RegulatoryActionResponse(
        success=True,
        institution_id=str(inst.id),
        action_type=action_key,
        action_code=action_key,
        action_id=action_uuid,
        status="DISPATCHED",
        reference_number=ref_no,
        dispatch_reference=ref_no,
        issued_at=issued_date,
        dispatched_at=issued_date,
        message=msg,
        summary=msg,
        pdf_download_url=pdf_url,
    )
