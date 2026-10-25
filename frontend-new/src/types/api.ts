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
  original_language?: string | null;
  original_description?: string | null;
  translation_provider?: string | null;
}

// ─── Attachments & Evidence ───────────────────────────────────────────────────

export interface RawCaseAttachment {
  id: string;
  case_id: string;
  uploaded_by_id: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  storage_bucket: string;
  storage_provider: string;
  secure_url: string;
  category: string;
  description: string | null;
  is_confidential: boolean;
  scan_status: string;
  sha256_hash: string | null;
  created_at: string;
}

// ─── Master Tickets & Smart Duplicate Grouping ────────────────────────────────

export interface RawMasterTicketChild {
  id: string;
  case_id: string;
  case_reference_id: string;
  subject: string;
  status: string;
  similarity_score: number;
  linked_at: string;
  is_anchor: boolean;
}

export interface RawMasterTicketSummary {
  id: string;
  ticket_reference_id: string;
  institution_name: string;
  bureau_code: string;
  bureau_name: string;
  consolidated_subject: string;
  category: string;
  child_count: number;
  avg_similarity_score: number;
  status: string;
  time_saved_hours: number;
  created_at: string;
}

export interface RawMasterTicketRead extends RawMasterTicketSummary {
  institution_id: string;
  institution_aicte_id: string;
  bureau_id: string;
  assigned_officer_id: string | null;
  assigned_officer_name: string | null;
  consolidated_description: string;
  common_grievance_theme: string | null;
  similarity_threshold: number;
  resolution_remarks: string | null;
  updated_at: string;
  resolved_at: string | null;
  children: RawMasterTicketChild[];
}

export interface RawDetectedGroup {
  anchor_case_reference_id: string;
  anchor_subject: string;
  institution_name: string;
  institution_aicte_id: string;
  bureau_code: string;
  bureau_name: string;
  category: string;
  member_count: number;
  avg_similarity: number;
  member_case_refs: string[];
  common_keywords: string[];
}

export interface RawAutoDetectResponse {
  total_cases_evaluated: number;
  groups_detected: number;
  groups: RawDetectedGroup[];
}

export interface RawMasterTicketStats {
  total_master_tickets: number;
  active_clusters: number;
  resolved_clusters: number;
  total_cases_grouped: number;
  estimated_hours_saved: number;
  top_affected_institutions: { institution_name: string; cluster_count: number }[];
}

// ─── Institution Trust Scores & Regulatory Actions ────────────────────────────

export interface RawDeductionBreakdown {
  sla_breaches_count: number;
  sla_breach_points: number;
  approaching_warnings_count: number;
  approaching_warning_points: number;
  severe_complaints_count: number;
  severe_complaint_points: number;
  sensitive_category_count: number;
  sensitive_category_points: number;
  master_ticket_clusters_count: number;
  master_ticket_points: number;
  backlog_dwell_count: number;
  backlog_dwell_points: number;
  recovery_bonus_points: number;
  total_deductions: number;
}

export interface RawCaseDeductionCitation {
  case_reference_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  points_deducted: number;
  deduction_reason: string;
  created_at: string;
}

export interface RawInstitutionTrustScoreDetail {
  institution_id: string;
  aicte_permanent_id: string;
  name: string;
  state: string;
  district: string;
  institution_type: string;
  trust_score: number;
  base_score: number;
  trust_grade: string;
  risk_level: string;
  risk_tier: string;
  trend: string;
  total_cases: number;
  open_cases: number;
  resolved_cases: number;
  overdue_cases: number;
  resolution_rate_pct: number;
  top_recurring_categories: { category: string; count: number }[];
  deduction_breakdown: RawDeductionBreakdown;
  citations: RawCaseDeductionCitation[];
  automated_directive: string;
  recommended_action_code: string;
  last_audit_date: string;
  pdf_notice_url?: string;
}

export interface RawTrustLeaderboardSummary {
  national_average_score: number;
  total_institutions: number;
  critical_risk_count: number;
  high_risk_count: number;
  watchlist_count: number;
  compliant_count: number;
}

export interface RawRegulatoryActionResponse {
  action_id: string;
  institution_id: string;
  action_type: string;
  status: string;
  dispatched_at: string;
  dispatch_reference: string;
  summary: string;
  pdf_download_url?: string;
}

// ─── Telegram Bot Tracker ─────────────────────────────────────────────────────

export interface RawTelegramBotInfo {
  bot_name: string;
  bot_username: string;
  is_configured: boolean;
  webhook_url_example: string;
  commands: { command: string; description: string }[];
  supported_formats: string[];
}

export interface RawTelegramSimulateResponse {
  message_sent: string;
  reply_html: string;
  extracted_case_ref: string | null;
  chat_id: number;
  parse_mode: string;
}

// ─── Magic AI Ingest & Multilingual ───────────────────────────────────────────

export interface RawExtractedInstitution {
  name: string;
  id: string | null;
  aicte_permanent_id: string | null;
  state: string | null;
  district: string | null;
  confidence: number;
  is_database_match: boolean;
  matched_phrase: string;
}

export interface RawTranslationResult {
  source_language: string;
  source_language_name: string;
  is_translated: boolean;
  original_text: string;
  translated_text: string;
  confidence: number;
  provider: string;
}

export interface RawMagicAnalysisResult {
  extracted_college: RawExtractedInstitution;
  categorization: {
    category: string;
    confidence: number;
    detected_signals: string[];
  };
  priority_assignment: {
    priority: string;
    urgency_signals: string[];
    sla_hours: number;
    rationale: string;
  };
  bureau_routing: {
    bureau_id: string;
    bureau_code: string;
    bureau_name: string;
    confidence: number;
    routing_rationale: string;
    all_scores: Record<string, number>;
    key_evidence_tokens: string[];
  };
  generated_subject: string;
  summary_insight: string;
  translation: RawTranslationResult;
}

export interface RawMagicIngestResponse {
  analysis: RawMagicAnalysisResult;
  case_created: boolean;
  case_reference_id: string | null;
  case_id: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string | null;
  docket_message: string;
  attachment_url?: string | null | undefined;
  attachment_id?: string | null | undefined;
  attachment_name?: string | null | undefined;
}

// ─── Analytics & Dashboard Overview ───────────────────────────────────────────

export interface RawBureauWorkloadStat {
  bureau_id: string;
  bureau_code: string;
  bureau_name: string;
  total_cases: number;
  open_cases?: number;
  active_cases?: number;
  resolved_cases: number;
  overdue_cases: number;
  approaching_cases?: number;
  resolution_rate_pct: number;
  avg_resolution_days?: number;
  avg_resolution_hours?: number;
}

export interface RawDashboardOverview {
  kpis?: {
    total_cases: number;
    open_cases: number;
    pending_action: number;
    approaching_deadline: number;
    overdue_cases: number;
    resolved_closed: number;
    resolution_rate_pct: number;
    rejected_spam_cases?: number;
    avg_resolution_hours?: number;
    avg_resolution_days?: number;
  };
  by_bureau?: RawBureauWorkloadStat[];
  by_status?: Record<string, number>;
  by_priority?: Record<string, number>;
  by_category?: Record<string, number>;

  total_cases?: number;
  active_cases?: number;
  resolved_cases?: number;
  overdue_cases?: number;
  approaching_sla_cases?: number;
  sla_compliance_rate_pct?: number;
  avg_resolution_dwell_days?: number;
  bureau_workload?: RawBureauWorkloadStat[];
  status_distribution?: { status: string; count: number }[];
  priority_distribution?: { priority: string; count: number }[];
}

export interface RawStageDwellTime {
  stage: string;
  avg_dwell_hours: number;
  case_count: number;
  exceeds_threshold: boolean;
}

export interface RawBottleneckAnalysis {
  stage_dwell_times: RawStageDwellTime[];
  critical_bottleneck_stage: string | null;
  analysis_summary: string;
}

export interface RawInstitutionPerformanceStat {
  institution_id: string;
  aicte_permanent_id: string;
  name: string;
  state: string;
  district: string;
  total_cases: number;
  active_cases: number;
  resolved_cases: number;
  overdue_cases: number;
  resolution_rate_pct: number;
  top_recurring_categories: { category: string; count: number }[];
  intervention_status: "COMPLIANT" | "WATCHLIST" | "CRITICAL_INTERVENTION";
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
