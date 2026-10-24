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
  };
}

export function adaptCases(raws: RawComplaintCase[]): ComplaintCase[] {
  return raws.map(adaptCase);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function adaptTimeline(raw: RawTimelineEvent): TimelineEntry {
  const meta = raw.metadata_json ?? {};
  // Extract the human-readable remark from known metadata keys
  const remark =
    (meta["remarks"] as string | undefined) ??
    (meta["reason"] as string | undefined) ??
    (meta["transfer_reason"] as string | undefined) ??
    null;

  return {
    id: raw.id,
    case_id: raw.case_id,
    actor_id: raw.actor_id,
    actor_role: raw.actor_role,
    actor_name: raw.actor_name,
    event_type: raw.event_type as AuditEventType,
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
    overdue_cases: raw.overdue_cases.map(adaptSlaItem),
    approaching_cases: raw.approaching_cases.map(adaptSlaItem),
  };
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
    rows: raw.rows.map(adaptCsvRow),
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
    permissions: raw.permissions,
  };
}
