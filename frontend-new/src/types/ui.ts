/**
 * UI types — flat, display-ready shapes used throughout components.
 * These are the canonical types for all screen code.
 *
 * Fixed contract from SPEC (do not rename fields or change enum strings):
 */

// ─── Core enums ───────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "SUPERVISOR" | "OFFICER" | "AUDITOR";

export type CasePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type CaseStatus =
  | "Received"
  | "Registered"
  | "Under Triage"
  | "Assigned"
  | "In Progress"
  | "Awaiting Information"
  | "Under Review"
  | "Resolved"
  | "Closed";

/** Real bureau codes from the seeded backend (NOT the SPEC's PAB/SDC/ADMIN_BUR). */
export type BureauCode = "APPR" | "STU" | "FDC" | "FIN";

export type SlaStatus = "OVERDUE" | "APPROACHING" | "ON_TRACK";

export type AuditEventType =
  | "REGISTERED"
  | "STATUS_CHANGE"
  | "REASSIGNED"
  | "NOTE_ADDED"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "TRIAGE_APPLIED";

// ─── Core fixed contract (from SPEC §2) ──────────────────────────────────────

/** Primary case type — flat, all fields from SPEC + real fields not in SPEC. */
export interface ComplaintCase {
  id: string;
  case_reference_id: string;        // e.g. "AICTE-2026-00104"
  institution_id: string;
  institution_name: string;
  aicte_permanent_id: string;        // e.g. "1-3324561"
  bureau_id: string;
  bureau_code: BureauCode;
  bureau_name: string;
  assigned_officer_id?: string;
  assigned_officer_name?: string;
  subject: string;
  description_redacted: string;
  description_confidential?: string; // undefined/null for AUDITOR
  category: string;
  priority: CasePriority;
  status: CaseStatus;
  due_date: string | null;           // ISO datetime string, nullable
  escalation_level: number;          // 0=Normal, 1=Approaching, 2=Overdue
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  closure_remarks: string | null;
}

// ─── Supporting UI types ──────────────────────────────────────────────────────

export interface Bureau {
  id: string;
  code: BureauCode;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Officer {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  bureau_id: string | null;
  bureau_name: string | null;
  bureau_code: string | null;
  permissions: string[];
}

export interface TimelineEntry {
  id: string;
  case_id: string;
  actor_id: string | null;
  actor_role: string;
  actor_name: string | null;
  event_type: AuditEventType;
  previous_state: CaseStatus | null;
  new_state: CaseStatus | null;
  /** Human-readable remark/reason. Extracted from metadata_json.remarks or metadata_json.reason. */
  remark: string | null;
  /** Full raw metadata for display in advanced view. */
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface Note {
  id: string;
  case_id: string;
  author_id: string;
  author_name: string | null;
  author_role: string | null;
  content: string;
  is_confidential: boolean;
  created_at: string;
}

export interface AssignmentHistoryEntry {
  id: string;
  case_id: string;
  from_bureau_id: string | null;
  from_bureau_name: string | null;
  to_bureau_id: string;
  to_bureau_name: string | null;
  assigned_by_id: string | null;
  assigned_by_name: string | null;
  transfer_reason: string;
  created_at: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface BureauStat {
  bureau_id: string;
  bureau_code: BureauCode;
  bureau_name: string;
  total: number;
  active: number;
  overdue: number;
  resolved: number;
}

export interface DashboardStats {
  total_cases: number;
  active_cases: number;       // not Resolved/Closed
  resolved_cases: number;
  closed_cases: number;
  overdue_cases: number;
  approaching_cases: number;
  on_track_cases: number;
  resolution_rate: number;    // 0–1
  bureau_breakdown: BureauStat[];
  status_breakdown: { status: CaseStatus; count: number }[];
  priority_breakdown: { priority: CasePriority; count: number }[];
}

// ─── SLA Radar ────────────────────────────────────────────────────────────────

export interface SlaRadarItem {
  case_reference_id: string;
  subject: string;
  category: string;
  priority: CasePriority;
  status: CaseStatus;
  bureau_code: BureauCode | null;
  bureau_name: string | null;
  institution_name: string | null;
  due_date: string | null;
  escalation_level: number;
  sla_status: SlaStatus;
  hours_remaining: number | null;
  is_overdue: boolean;
}

export interface SlaRadarSummary {
  total_active_cases: number;
  overdue_count: number;
  approaching_count: number;
  on_track_count: number;
  completed_count: number;
  overdue_cases: SlaRadarItem[];
  approaching_cases: SlaRadarItem[];
}

// ─── Smart Triage ─────────────────────────────────────────────────────────────

export interface DuplicateMatch {
  case_reference_id: string;
  subject: string;
  institution_name: string;
  status: CaseStatus;
  similarity_score: number; // 0–1
  matched_keywords: string[];
}

export interface TriageKeywordWeight {
  keyword: string;
  weight: number;      // 0–1, weights sum to 1 across matched keywords
  resulting_route: string;
}

export interface TriageResult {
  recommended_bureau_code: BureauCode;
  recommended_bureau_name: string;
  recommended_category: string;
  recommended_priority: CasePriority;
  confidence: number;          // 0–1
  matched_keywords: TriageKeywordWeight[];
  rationale: string;
}

// ─── CSV Ingestion ────────────────────────────────────────────────────────────

export interface CsvRowError {
  row_number: number;
  field: string;
  message: string;
}

export interface CsvRowResult {
  row_number: number;
  is_valid: boolean;
  institution_aicte_id: string;
  institution_name: string | null;
  bureau_code: string;
  bureau_name: string | null;
  subject: string;
  category: string;
  priority: string;
  is_confidential: boolean;
  description: string;
  errors: CsvRowError[];
  warnings: string[];
  duplicate_case_ref: string | null;
}

export interface CsvPreviewResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  can_commit: boolean;
  rows: CsvRowResult[];
}

export interface CsvCommitResult {
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_case_references: string[];
}

// ─── API call shapes ──────────────────────────────────────────────────────────

export interface ListCasesParams {
  bureau_id?: string;
  institution_id?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  search?: string;
  sort_by?: "created_at" | "due_date" | "priority" | "status" | "subject";
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface ListCasesResponse {
  items: ComplaintCase[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TransitionCaseParams {
  case_ref: string;
  to_status: CaseStatus;
  remarks: string;
}

export interface AssignCaseParams {
  case_ref: string;
  to_bureau_id: string;
  to_officer_id?: string;
  reason: string;
}

export interface EscalateParams {
  case_ref: string;
  reason: string;
}

export interface AddNoteParams {
  case_ref: string;
  content: string;
  is_confidential: boolean;
}

/** Normalised error thrown by the API layer */
export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}
