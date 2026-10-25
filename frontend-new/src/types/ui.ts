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
  assigned_officer_id?: string | null | undefined;
  assigned_officer_name?: string | null | undefined;
  subject: string;
  description_redacted: string;
  description_confidential?: string | null | undefined; // undefined/null for AUDITOR
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
  institution_state?: string | undefined;
  institution_district?: string | undefined;
  institution_type?: string | undefined;
  original_language?: string | null | undefined;
  original_description?: string | null | undefined;
  translation_provider?: string | null | undefined;
  complainant_verification_badge?: Record<string, unknown> | null | undefined;
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
  bureau_id?: string | undefined;
  institution_id?: string | undefined;
  status?: CaseStatus | undefined;
  priority?: CasePriority | undefined;
  search?: string | undefined;
  sort_by?: ("created_at" | "due_date" | "priority" | "status" | "subject") | undefined;
  sort_dir?: ("asc" | "desc") | undefined;
  page?: number | undefined;
  page_size?: number | undefined;
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
  to_officer_id?: string | undefined;
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

// ─── Attachments ──────────────────────────────────────────────────────────────

export interface CaseAttachment {
  id: string;
  case_id: string;
  uploaded_by_id?: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  storage_bucket: string;
  storage_provider: string;
  secure_url: string;
  category: string;
  description?: string | null;
  is_confidential: boolean;
  scan_status: string;
  sha256_hash?: string | null;
  created_at: string;
}

// ─── Master Tickets & Smart Duplicate Grouping ────────────────────────────────

export type MasterTicketStatus = "DETECTED" | "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";

export interface MasterTicketChild {
  id: string;
  case_id: string;
  case_reference_id: string;
  subject: string;
  status: string;
  similarity_score: number;
  linked_at: string;
  is_anchor: boolean;
}

export interface MasterTicket {
  id: string;
  ticket_reference_id: string;
  institution_id: string;
  institution_name: string;
  institution_aicte_id: string;
  bureau_id: string;
  bureau_code: string;
  bureau_name: string;
  assigned_officer_id?: string | null;
  assigned_officer_name?: string | null;
  consolidated_subject: string;
  consolidated_description: string;
  category: string;
  common_grievance_theme?: string | null;
  child_count: number;
  similarity_threshold: number;
  avg_similarity_score: number;
  status: MasterTicketStatus;
  resolution_remarks?: string | null;
  time_saved_hours: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  children: MasterTicketChild[];
}

export interface DetectedGroup {
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

export interface MasterTicketStats {
  total_master_tickets: number;
  active_clusters: number;
  resolved_clusters: number;
  total_cases_grouped: number;
  estimated_hours_saved: number;
  top_affected_institutions: { institution_name: string; cluster_count: number }[];
}

// ─── Institution Trust Scores & Regulatory Actions ────────────────────────────

export interface DeductionBreakdown {
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

export interface CaseDeductionCitation {
  case_reference_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  points_deducted: number;
  deduction_reason: string;
  created_at: string;
}

export interface InstitutionTrustScore {
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
  trend: "improving" | "stable" | "deteriorating";
  total_cases: number;
  open_cases: number;
  resolved_cases: number;
  overdue_cases: number;
  resolution_rate_pct: number;
  top_recurring_categories: { category: string; count: number }[];
  deduction_breakdown: DeductionBreakdown;
  citations: CaseDeductionCitation[];
  automated_directive: string;
  recommended_action_code: string;
  last_audit_date: string;
  pdf_notice_url?: string | undefined;
}

export interface TrustLeaderboardSummary {
  national_average_score: number;
  total_institutions: number;
  critical_risk_count: number;
  high_risk_count: number;
  watchlist_count: number;
  compliant_count: number;
}

export interface RegulatoryActionResponse {
  action_id: string;
  institution_id: string;
  action_type: string;
  status: string;
  dispatched_at: string;
  dispatch_reference: string;
  summary: string;
  pdf_download_url?: string | undefined;
}

// ─── Telegram Bot Tracker ─────────────────────────────────────────────────────

export interface TelegramBotInfo {
  bot_name: string;
  bot_username: string;
  is_configured: boolean;
  webhook_url_example: string;
  commands: { command: string; description: string }[];
  supported_formats: string[];
}

export interface TelegramSimulateResponse {
  message_sent: string;
  reply_html: string;
  extracted_case_ref: string | null;
  chat_id: number;
  parse_mode: string;
}

// ─── Magic AI Ingestion & Multilingual ────────────────────────────────────────

export interface MagicExtractedCollege {
  name: string;
  id: string | null;
  aicte_permanent_id: string | null;
  state: string | null;
  district: string | null;
  confidence: number;
  is_database_match: boolean;
  matched_phrase: string;
}

export interface MagicTranslation {
  source_language: string;
  source_language_name: string;
  is_translated: boolean;
  original_text: string;
  translated_text: string;
  confidence: number;
  provider: string;
}

export interface MagicAnalysisResult {
  extracted_college: MagicExtractedCollege;
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
  translation: MagicTranslation;
}

export interface MagicIngestResponse {
  analysis: MagicAnalysisResult;
  case_created: boolean;
  case_reference_id: string | null;
  case_id: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string | null;
  docket_message: string;
}

// ─── Bottleneck Analytics ─────────────────────────────────────────────────────

export interface StageDwellTime {
  stage: string;
  avg_dwell_hours: number;
  case_count: number;
  exceeds_threshold: boolean;
}

export interface BottleneckAnalysis {
  stage_dwell_times: StageDwellTime[];
  critical_bottleneck_stage: string | null;
  analysis_summary: string;
}

export interface InstitutionPerformanceStat {
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

// ─── Student Portal & Complainant Identity ─────────────────────────────────────

export interface StudentAuthProfile {
  verification_token: string;
  complainant_id: string;
  masked_identifier: string;
  full_name: string;
  complainant_type: "STUDENT" | "FACULTY" | "PARENT" | "CITIZEN";
  verification_method: string;
  verified_at: string;
  is_whistleblower_shielded: boolean;
}

export interface StudentCaseAttachment {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  secure_url: string;
  category: string;
  description: string | null;
  created_at: string;
}

export interface StudentCaseTimelineItem {
  timestamp: string;
  event_type: string;
  previous_state: string | null;
  new_state: string | null;
  remarks: string | null;
}

export interface StudentGrievanceCase {
  id: string;
  case_reference_id: string;
  subject: string;
  description_redacted: string;
  category: string;
  priority: CasePriority;
  status: CaseStatus;
  institution_name: string;
  aicte_permanent_id: string | null;
  bureau_code: BureauCode;
  bureau_name: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closure_remarks: string | null;
  is_awaiting_information: boolean;
  attachments: StudentCaseAttachment[];
  timeline: StudentCaseTimelineItem[];
}

export interface StudentPortalData {
  complainant: StudentAuthProfile;
  cases: StudentGrievanceCase[];
  active_count: number;
  action_required_count: number;
  resolved_count: number;
}

export interface StudentUploadResult {
  attachment: StudentCaseAttachment;
  case_reference_id: string;
  new_status: string;
  message: string;
}

