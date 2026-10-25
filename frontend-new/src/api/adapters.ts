/**
 * Adapters — convert raw backend JSON into flat UI types.
 *
 * These are the ONLY place where backend→UI field mapping lives.
 * If the backend changes a field name or nesting structure, fix it here;
 * UI components must not change.
 */

import type {
  RawComplaintCase,
  RawTimelineEvent,
  RawCaseNote,
  RawAssignmentHistory,
  RawBureau,
  RawOfficer,
  RawSlaRadarItem,
  RawSlaRadarSummary,
  RawCsvRowPreview,
  RawCsvPreviewResponse,
  RawCsvCommitResponse,
  RawAuthUser,
  RawCaseAttachment,
  RawMasterTicketRead,
  RawMasterTicketSummary,
  RawMasterTicketChild,
  RawDetectedGroup,
  RawMasterTicketStats,
  RawInstitutionTrustScoreDetail,
  RawTrustLeaderboardSummary,
  RawRegulatoryActionResponse,
  RawTelegramBotInfo,
  RawTelegramSimulateResponse,
  RawMagicAnalysisResult,
  RawMagicIngestResponse,
  RawDashboardOverview,
  RawBottleneckAnalysis,
  RawInstitutionPerformanceStat,
} from "@/types/api";
import type {
  ComplaintCase,
  TimelineEntry,
  Note,
  AssignmentHistoryEntry,
  Bureau,
  Officer,
  SlaRadarItem,
  SlaRadarSummary,
  CsvRowResult,
  CsvPreviewResult,
  CsvCommitResult,
  CurrentUser,
  BureauCode,
  CasePriority,
  CaseStatus,
  SlaStatus,
  AuditEventType,
  CaseAttachment,
  MasterTicket,
  MasterTicketChild,
  MasterTicketStatus,
  DetectedGroup,
  MasterTicketStats,
  InstitutionTrustScore,
  TrustLeaderboardSummary,
  RegulatoryActionResponse,
  TelegramBotInfo,
  TelegramSimulateResponse,
  MagicAnalysisResult,
  MagicIngestResponse,
  DashboardStats,
  BottleneckAnalysis,
  InstitutionPerformanceStat,
} from "@/types/ui";

// ─── Case ─────────────────────────────────────────────────────────────────────

export function adaptCase(raw: RawComplaintCase): ComplaintCase {
  return {
    id: raw.id,
    case_reference_id: raw.case_reference_id,
    institution_id: raw.institution_id,
    institution_name: raw.institution?.name ?? "(unknown institution)",
    aicte_permanent_id: raw.institution?.aicte_permanent_id ?? "",
    bureau_id: raw.bureau_id,
    bureau_code: (raw.bureau?.code ?? "") as BureauCode,
    bureau_name: raw.bureau?.name ?? "",
    assigned_officer_id: raw.assigned_officer_id ?? undefined,
    assigned_officer_name: raw.assigned_officer?.full_name ?? undefined,
    subject: raw.subject,
    description_redacted: raw.description_redacted,
    description_confidential: raw.description_confidential ?? undefined,
    category: raw.category,
    priority: raw.priority as CasePriority,
    status: raw.status as CaseStatus,
    due_date: raw.due_date,
    escalation_level: raw.escalation_level,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    resolved_at: raw.resolved_at,
    closed_at: raw.closed_at,
    closure_remarks: raw.closure_remarks,
    institution_state: raw.institution?.state,
    institution_district: raw.institution?.district,
    institution_type: raw.institution?.institution_type,
    original_language: raw.original_language,
    original_description: raw.original_description,
    translation_provider: raw.translation_provider,
    complainant_verification_badge: raw.complainant_verification_badge,
  };
}

export function adaptCases(raws: RawComplaintCase[]): ComplaintCase[] {
  return raws.map(adaptCase);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function adaptTimeline(raw: RawTimelineEvent): TimelineEntry {
  const meta = raw.metadata_json ?? {};
  const remark =
    (meta["remarks"] as string | undefined) ??
    (meta["reason"] as string | undefined) ??
    (meta["transfer_reason"] as string | undefined) ??
    (meta["justification"] as string | undefined) ??
    null;

  const eventType = (meta["action"] === "AI_RECOMMENDATION_ACCEPTED" || raw.event_type === "TRIAGE_APPLIED")
    ? "TRIAGE_APPLIED"
    : raw.event_type;

  return {
    id: raw.id,
    case_id: raw.case_id,
    actor_id: raw.actor_id,
    actor_role: raw.actor_role,
    actor_name: raw.actor_name,
    event_type: eventType as AuditEventType,
    previous_state: (raw.previous_state as CaseStatus | null) ?? null,
    new_state: (raw.new_state as CaseStatus | null) ?? null,
    remark,
    metadata: raw.metadata_json,
    timestamp: raw.timestamp,
  };
}

export function adaptTimelineList(raws: RawTimelineEvent[]): TimelineEntry[] {
  return raws.map(adaptTimeline);
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function adaptNote(raw: RawCaseNote): Note {
  return {
    id: raw.id,
    case_id: raw.case_id,
    author_id: raw.author_id,
    author_name: raw.author?.full_name ?? null,
    author_role: raw.author?.role ?? null,
    content: raw.content,
    is_confidential: raw.is_confidential,
    created_at: raw.created_at,
  };
}

export function adaptNotes(raws: RawCaseNote[]): Note[] {
  return raws.map(adaptNote);
}

// ─── Assignment history ───────────────────────────────────────────────────────

export function adaptAssignmentHistory(
  raw: RawAssignmentHistory,
): AssignmentHistoryEntry {
  return {
    id: raw.id,
    case_id: raw.case_id,
    from_bureau_id: raw.from_bureau_id,
    from_bureau_name: raw.from_bureau?.name ?? null,
    to_bureau_id: raw.to_bureau_id,
    to_bureau_name: raw.to_bureau?.name ?? null,
    assigned_by_id: raw.assigned_by_id,
    assigned_by_name: raw.assigned_by?.full_name ?? null,
    transfer_reason: raw.transfer_reason,
    created_at: raw.created_at,
  };
}

export function adaptAssignmentHistoryList(
  raws: RawAssignmentHistory[],
): AssignmentHistoryEntry[] {
  return raws.map(adaptAssignmentHistory);
}

// ─── Bureau ───────────────────────────────────────────────────────────────────

export function adaptBureau(raw: RawBureau): Bureau {
  return {
    id: raw.id,
    code: raw.code as BureauCode,
    name: raw.name,
    description: raw.description,
    is_active: raw.is_active,
  };
}

export function adaptBureaus(raws: RawBureau[]): Bureau[] {
  return raws.map(adaptBureau);
}

// ─── Officer ──────────────────────────────────────────────────────────────────

export function adaptOfficer(raw: RawOfficer): Officer {
  return {
    id: raw.id,
    email: raw.email,
    full_name: raw.full_name,
    role: raw.role,
  };
}

export function adaptOfficers(raws: RawOfficer[]): Officer[] {
  return raws.map(adaptOfficer);
}

// ─── SLA Radar ────────────────────────────────────────────────────────────────

export function adaptSlaItem(raw: RawSlaRadarItem): SlaRadarItem {
  return {
    case_reference_id: raw.case_reference_id,
    subject: raw.subject,
    category: raw.category,
    priority: raw.priority as CasePriority,
    status: raw.status as CaseStatus,
    bureau_code: (raw.bureau_code as BureauCode | null) ?? null,
    bureau_name: raw.bureau_name,
    institution_name: raw.institution_name,
    due_date: raw.due_date,
    escalation_level: raw.escalation_level,
    sla_status: raw.sla_status as SlaStatus,
    hours_remaining: raw.hours_remaining,
    is_overdue: raw.is_overdue,
  };
}

export function adaptSlaRadar(raw: RawSlaRadarSummary): SlaRadarSummary {
  return {
    total_active_cases: raw.total_active_cases,
    overdue_count: raw.overdue_count,
    approaching_count: raw.approaching_count,
    on_track_count: raw.on_track_count,
    completed_count: raw.completed_count,
    overdue_cases: (raw.overdue_cases ?? []).map(adaptSlaItem),
    approaching_cases: (raw.approaching_cases ?? []).map(adaptSlaItem),
  };
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export function adaptAttachment(raw: RawCaseAttachment): CaseAttachment {
  return {
    id: raw.id,
    case_id: raw.case_id,
    uploaded_by_id: raw.uploaded_by_id,
    file_name: raw.file_name,
    file_size_bytes: raw.file_size_bytes,
    mime_type: raw.mime_type,
    storage_path: raw.storage_path,
    storage_bucket: raw.storage_bucket,
    storage_provider: raw.storage_provider,
    secure_url: raw.secure_url,
    category: raw.category,
    description: raw.description,
    is_confidential: raw.is_confidential,
    scan_status: raw.scan_status,
    sha256_hash: raw.sha256_hash,
    created_at: raw.created_at,
  };
}

export function adaptAttachments(raws: RawCaseAttachment[]): CaseAttachment[] {
  return raws.map(adaptAttachment);
}

// ─── Master Tickets ───────────────────────────────────────────────────────────

export function adaptMasterTicketChild(raw: RawMasterTicketChild): MasterTicketChild {
  return {
    id: raw.id,
    case_id: raw.case_id,
    case_reference_id: raw.case_reference_id,
    subject: raw.subject,
    status: raw.status,
    similarity_score: raw.similarity_score,
    linked_at: raw.linked_at,
    is_anchor: raw.is_anchor,
  };
}

export function adaptMasterTicket(raw: RawMasterTicketRead | RawMasterTicketSummary): MasterTicket {
  const isFull = "institution_id" in raw;
  return {
    id: raw.id,
    ticket_reference_id: raw.ticket_reference_id,
    institution_id: isFull ? (raw as RawMasterTicketRead).institution_id : "",
    institution_name: raw.institution_name,
    institution_aicte_id: isFull ? (raw as RawMasterTicketRead).institution_aicte_id : "",
    bureau_id: isFull ? (raw as RawMasterTicketRead).bureau_id : "",
    bureau_code: raw.bureau_code,
    bureau_name: raw.bureau_name,
    assigned_officer_id: isFull ? ((raw as RawMasterTicketRead).assigned_officer_id ?? null) : null,
    assigned_officer_name: isFull ? ((raw as RawMasterTicketRead).assigned_officer_name ?? null) : null,
    consolidated_subject: raw.consolidated_subject,
    consolidated_description: isFull ? (raw as RawMasterTicketRead).consolidated_description : raw.consolidated_subject,
    category: raw.category,
    common_grievance_theme: isFull ? ((raw as RawMasterTicketRead).common_grievance_theme ?? null) : null,
    child_count: raw.child_count,
    similarity_threshold: isFull ? (raw as RawMasterTicketRead).similarity_threshold : 0.78,
    avg_similarity_score: raw.avg_similarity_score,
    status: raw.status as MasterTicketStatus,
    resolution_remarks: isFull ? ((raw as RawMasterTicketRead).resolution_remarks ?? null) : null,
    time_saved_hours: raw.time_saved_hours,
    created_at: raw.created_at,
    updated_at: isFull ? (raw as RawMasterTicketRead).updated_at : raw.created_at,
    resolved_at: isFull ? ((raw as RawMasterTicketRead).resolved_at ?? null) : null,
    children: isFull ? ((raw as RawMasterTicketRead).children ?? []).map(adaptMasterTicketChild) : [],
  };
}

export function adaptMasterTickets(raws: (RawMasterTicketRead | RawMasterTicketSummary)[]): MasterTicket[] {
  return raws.map(adaptMasterTicket);
}

export function adaptDetectedGroup(raw: RawDetectedGroup): DetectedGroup {
  return { ...raw };
}

export function adaptMasterTicketStats(raw: RawMasterTicketStats): MasterTicketStats {
  return { ...raw };
}

// ─── Institution Trust Scores ─────────────────────────────────────────────────

export function adaptTrustScoreDetail(raw: RawInstitutionTrustScoreDetail): InstitutionTrustScore {
  return {
    institution_id: raw.institution_id,
    aicte_permanent_id: raw.aicte_permanent_id,
    name: raw.name,
    state: raw.state,
    district: raw.district,
    institution_type: raw.institution_type,
    trust_score: raw.trust_score,
    base_score: raw.base_score,
    trust_grade: raw.trust_grade,
    risk_level: raw.risk_level,
    risk_tier: raw.risk_tier,
    trend: (raw.trend as "improving" | "stable" | "deteriorating") || "stable",
    total_cases: raw.total_cases,
    open_cases: raw.open_cases,
    resolved_cases: raw.resolved_cases,
    overdue_cases: raw.overdue_cases,
    resolution_rate_pct: raw.resolution_rate_pct,
    top_recurring_categories: raw.top_recurring_categories ?? [],
    deduction_breakdown: raw.deduction_breakdown,
    citations: raw.citations ?? [],
    automated_directive: raw.automated_directive,
    recommended_action_code: raw.recommended_action_code,
    last_audit_date: raw.last_audit_date,
    pdf_notice_url: raw.pdf_notice_url || ((raw as any).trust_score < 400 ? `/api/v1/institutions/${raw.institution_id}/regulatory-notice.pdf` : undefined),
  };
}

export function adaptTrustLeaderboardSummary(raw: RawTrustLeaderboardSummary): TrustLeaderboardSummary {
  return { ...raw };
}

export function adaptRegulatoryAction(raw: RawRegulatoryActionResponse): RegulatoryActionResponse {
  const r = raw as any;
  const instId = raw.institution_id || r.institutionId || "";
  const actType = raw.action_type || r.action_code || "SHOW_CAUSE_SUMMONS";
  const refNo = raw.dispatch_reference || r.reference_number || "";

  return {
    action_id: raw.action_id || r.id || r.reference_number || "act-" + Date.now(),
    institution_id: instId,
    action_type: actType,
    status: raw.status || (r.success ? "DISPATCHED" : "PENDING"),
    dispatched_at: raw.dispatched_at || r.issued_at || new Date().toISOString(),
    dispatch_reference: refNo,
    summary: raw.summary || r.message || "",
    pdf_download_url: raw.pdf_download_url || r.pdf_download_url || (instId ? `/api/v1/institutions/${instId}/regulatory-notice.pdf?action_type=${actType}&ref=${refNo}` : undefined),
  };
}

// ─── Telegram Bot Tracker ─────────────────────────────────────────────────────

export function adaptTelegramBotInfo(raw: RawTelegramBotInfo): TelegramBotInfo {
  return { ...raw };
}

export function adaptTelegramSimulateResponse(raw: RawTelegramSimulateResponse): TelegramSimulateResponse {
  return { ...raw };
}

// ─── Magic AI Ingestion ───────────────────────────────────────────────────────

export function adaptMagicAnalysisResult(raw: RawMagicAnalysisResult): MagicAnalysisResult {
  return { ...raw };
}

export function adaptMagicIngestResponse(raw: RawMagicIngestResponse): MagicIngestResponse {
  return { ...raw };
}

// ─── Dashboard Stats & Analytics ──────────────────────────────────────────────

export function adaptDashboardStats(overview: any): DashboardStats {
  const kpis = overview.kpis;
  const rawBureauList: any[] = overview.by_bureau ?? overview.bureau_workload ?? [];

  const totalCases = kpis?.total_cases ?? overview.total_cases ?? 0;
  const activeCases = kpis?.open_cases ?? overview.active_cases ?? 0;
  const resolvedCases = kpis?.resolved_closed ?? overview.resolved_cases ?? 0;
  const overdueCases = kpis?.overdue_cases ?? overview.overdue_cases ?? 0;
  const approachingCases = kpis?.approaching_deadline ?? overview.approaching_sla_cases ?? 0;
  const rawRate = kpis?.resolution_rate_pct ?? overview.sla_compliance_rate_pct ?? 0;
  const resolutionRate = rawRate > 1 ? rawRate / 100 : rawRate;

  let closedCases = 0;
  if (overview.by_status && typeof overview.by_status === "object" && !Array.isArray(overview.by_status)) {
    closedCases = overview.by_status["Closed"] ?? 0;
  } else if (Array.isArray(overview.status_distribution)) {
    closedCases = overview.status_distribution.find((s: any) => s.status === "Closed")?.count ?? 0;
  }

  let statusBreakdown: { status: CaseStatus; count: number }[] = [];
  if (overview.by_status && typeof overview.by_status === "object" && !Array.isArray(overview.by_status)) {
    statusBreakdown = Object.entries(overview.by_status).map(([st, cnt]) => ({
      status: st as CaseStatus,
      count: cnt as number,
    }));
  } else if (Array.isArray(overview.status_distribution)) {
    statusBreakdown = overview.status_distribution.map((s: any) => ({
      status: s.status as CaseStatus,
      count: s.count,
    }));
  }

  let priorityBreakdown: { priority: CasePriority; count: number }[] = [];
  if (overview.by_priority && typeof overview.by_priority === "object" && !Array.isArray(overview.by_priority)) {
    priorityBreakdown = Object.entries(overview.by_priority).map(([pr, cnt]) => ({
      priority: pr as CasePriority,
      count: cnt as number,
    }));
  } else if (Array.isArray(overview.priority_distribution)) {
    priorityBreakdown = overview.priority_distribution.map((p: any) => ({
      priority: p.priority as CasePriority,
      count: p.count,
    }));
  }

  const bureauBreakdown = rawBureauList.map((b: any) => ({
    bureau_id: b.bureau_id,
    bureau_code: b.bureau_code as BureauCode,
    bureau_name: b.bureau_name,
    total: b.total_cases ?? b.total ?? 0,
    active: b.open_cases ?? b.active_cases ?? b.active ?? 0,
    overdue: b.overdue_cases ?? b.overdue ?? 0,
    resolved: b.resolved_cases ?? b.resolved ?? 0,
    approaching: b.approaching_cases ?? b.approaching ?? 0,
  }));

  return {
    total_cases: totalCases,
    active_cases: activeCases,
    resolved_cases: resolvedCases,
    closed_cases: closedCases,
    overdue_cases: overdueCases,
    approaching_cases: approachingCases,
    on_track_cases: Math.max(0, activeCases - overdueCases - approachingCases),
    resolution_rate: resolutionRate,
    bureau_breakdown: bureauBreakdown,
    status_breakdown: statusBreakdown,
    priority_breakdown: priorityBreakdown,
  };
}

export function adaptBottleneckAnalysis(raw: any): BottleneckAnalysis {
  const stageList = raw.stage_dwell_times ?? (raw.stages ?? []).map((s: any) => ({
    stage: s.stage,
    avg_dwell_hours: s.avg_hours ?? s.avg_dwell_hours ?? 0,
    case_count: s.count ?? s.case_count ?? 0,
    exceeds_threshold: s.is_bottleneck ?? s.exceeds_threshold ?? false,
  }));

  return {
    stage_dwell_times: stageList,
    critical_bottleneck_stage: raw.critical_bottleneck_stage ?? raw.primary_bottleneck_stage ?? null,
    analysis_summary: raw.analysis_summary ?? raw.operational_advisory ?? raw.system_health_status ?? "",
  };
}

export function adaptInstitutionPerformanceStat(raw: RawInstitutionPerformanceStat): InstitutionPerformanceStat {
  return { ...raw };
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function adaptCsvRow(raw: RawCsvRowPreview): CsvRowResult {
  return { ...raw };
}

export function adaptCsvPreview(raw: RawCsvPreviewResponse): CsvPreviewResult {
  return {
    total_rows: raw.total_rows,
    valid_rows: raw.valid_rows,
    invalid_rows: raw.invalid_rows,
    can_commit: raw.can_commit,
    rows: (raw.rows ?? []).map(adaptCsvRow),
  };
}

export function adaptCsvCommit(raw: RawCsvCommitResponse): CsvCommitResult {
  return { ...raw };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function adaptCurrentUser(raw: RawAuthUser): CurrentUser {
  return {
    id: raw.id,
    email: raw.email,
    full_name: raw.full_name,
    role: raw.role as CurrentUser["role"],
    bureau_id: raw.bureau_id,
    bureau_name: raw.bureau_name,
    bureau_code: raw.bureau_code,
    permissions: raw.permissions ?? [],
  };
}
