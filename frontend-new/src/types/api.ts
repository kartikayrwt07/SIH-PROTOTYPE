/**
 * Raw API response shapes — exactly what the backend returns.
 * Keep in sync with backend schemas. Do NOT import these in UI components;
 * use src/types/ui.ts instead (adapters handle the mapping).
 */

// ─── Envelope types ──────────────────────────────────────────────────────────

export interface StandardResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorInfo | null;
  metadata: Record<string, unknown> | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  metadata: PaginationMetadata;
}

export interface PaginationMetadata {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiErrorInfo {
  code: string;
  message: string;
  details: ApiErrorDetail[] | null;
  timestamp: string;
}

export interface ApiErrorDetail {
  field: string | null;
  message: string;
  details?: unknown;
}

/**
 * Some endpoints (e.g. illegal lifecycle transitions) raise HTTPException
 * directly, producing { "detail": ... } instead of StandardResponse.
 * The client normalises both shapes into ApiError.
 */
export interface RawHttpException {
  detail:
    | string
    | {
        code: string;
        message: string;
        current_status?: string;
        attempted_status?: string;
        allowed_transitions?: string[];
        [key: string]: unknown;
      };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RawToken {
  access_token: string;
  token_type: string;
}

/** Shape returned by GET /auth/switch-demo-role/{role} — note: "token" not "access_token" */
export interface RawSwitchDemoRoleData {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    bureau_id: string | null;
  };
  token: string; // JWT access token
}

export interface RawAuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  bureau_id: string | null;
  bureau_name: string | null;
  bureau_code: string | null;
  permissions: string[];
}

// ─── Bureau ───────────────────────────────────────────────────────────────────

export interface RawBureau {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RawOfficer {
  id: string;
  email: string;
  full_name: string;
  role: string;
  // bureau_id is NOT included in /bureaus/{id}/officers response
}

// ─── Institution (nested inside ComplaintCaseRaw) ─────────────────────────────

export interface RawInstitution {
  id: string;
  aicte_permanent_id: string;
  name: string;
  state: string;
  district: string;
  institution_type: string;
}

export interface RawUserSummary {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

// ─── Case ─────────────────────────────────────────────────────────────────────

/**
 * ComplaintCase as returned by the backend.
 * Has NESTED institution, bureau, assigned_officer — the adapter flattens these.
 */
export interface RawComplaintCase {
  id: string;
  case_reference_id: string;
  institution_id: string;
  bureau_id: string;
  assigned_officer_id: string | null;
  complainant_identity_id: string | null;
  complainant_verification_badge: Record<string, unknown> | null;
  subject: string;
  description_redacted: string;
  description_confidential: string | null; // null for AUDITOR
  category: string;
  priority: string; // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: string;   // "Received" | "Registered" | ... (space-separated, as in enum)
  due_date: string | null; // ISO datetime
  escalation_level: number;
  closure_remarks: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  institution: RawInstitution | null;
  bureau: RawBureau | null;
  assigned_officer: RawUserSummary | null;
}

// ─── Timeline (audit events) ──────────────────────────────────────────────────

export interface RawTimelineEvent {
  id: string;
  case_id: string;
  actor_id: string | null;
  actor_role: string;
  actor_name: string | null;
  event_type: string; // AuditEventType enum value
  previous_state: string | null;
  new_state: string | null;
  /** Keys present vary by event_type: remarks, reason, action, channel, batch_id, etc. */
  metadata_json: Record<string, unknown> | null;
  timestamp: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface RawCaseNote {
  id: string;
  case_id: string;
  author_id: string;
  content: string;
  is_confidential: boolean;
  created_at: string;
  author: RawUserSummary | null;
}

// ─── Assignment history ───────────────────────────────────────────────────────

export interface RawAssignmentHistory {
  id: string;
  case_id: string;
  from_bureau_id: string | null;
  to_bureau_id: string;
  assigned_by_id: string | null;
  transfer_reason: string;
  created_at: string;
  from_bureau: RawBureau | null;
  to_bureau: RawBureau | null;
  assigned_by: RawUserSummary | null;
}

// ─── SLA Radar ────────────────────────────────────────────────────────────────

export interface RawSlaRadarItem {
  case_reference_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  bureau_code: string | null;
  bureau_name: string | null;
  institution_name: string | null;
  due_date: string | null;
  escalation_level: number;
  /** "OVERDUE" | "APPROACHING" | "ON_TRACK" — uppercase with underscore */
  sla_status: string;
  hours_remaining: number | null;
  is_overdue: boolean;
}

export interface RawSlaRadarSummary {
  total_active_cases: number;
  overdue_count: number;
  approaching_count: number;
  on_track_count: number;
  completed_count: number;
  overdue_cases: RawSlaRadarItem[];
  approaching_cases: RawSlaRadarItem[];
}

// ─── CSV I/O ──────────────────────────────────────────────────────────────────

export interface RawCsvRowError {
  row_number: number;
  field: string;
  message: string;
}

export interface RawCsvRowPreview {
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
  errors: RawCsvRowError[];
  warnings: string[];
  duplicate_case_ref: string | null;
}

export interface RawCsvPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  can_commit: boolean;
  rows: RawCsvRowPreview[];
}

export interface RawCsvCommitResponse {
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_case_references: string[];
}
