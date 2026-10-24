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

export interface Bureau {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  bureau_id?: string;
  bureau_name?: string;
  bureau_code?: string;
}

export interface Institution {
  id: string;
  aicte_permanent_id: string;
  name: string;
  state: string;
  district: string;
  institution_type: string;
}

export interface ComplaintCase {
  id: string;
  case_reference_id: string;
  institution_id: string;
  bureau_id: string;
  assigned_officer_id?: string;
  subject: string;
  description_redacted: string;
  description_confidential?: string;
  category: string;
  priority: CasePriority;
  status: CaseStatus;
  due_date?: string;
  escalation_level: number; // 0=Normal, 1=Approaching, 2=Overdue
  closure_remarks?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  institution?: Institution;
  bureau?: Bureau;
  assigned_officer?: UserSummary;
  complainant_verification_badge?: ComplainantVerificationBadge;
}

export interface CaseAttachment {
  id: string;
  case_id: string;
  uploaded_by_id?: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  storage_bucket: string;
  category: "FEE_RECEIPT" | "BANK_STATEMENT" | "AFFILIATION_DOCUMENT" | "FACILITY_PHOTOGRAPH" | "SALARY_SLIP" | "COMMUNICATION_RECORD" | "OTHER";
  description?: string;
  is_confidential: boolean;
  scan_status: "PENDING" | "CLEAN" | "INFECTED" | "SKIPPED";
  sha256_hash?: string;
  created_at: string;
}

export interface ComplainantVerificationBadge {
  is_verified: boolean;
  verification_method: "AADHAAR_OTP" | "DIGILOCKER_OAUTH" | "STUDENT_PORTAL_SSO" | "MOBILE_EMAIL_2FA";
  masked_identifier: string;
  complainant_type: "STUDENT" | "FACULTY" | "PARENT" | "CITIZEN";
  verified_at?: string;
  whistleblower_shielded: boolean;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  actor_id?: string;
  actor_role: string;
  actor_name?: string;
  event_type: string;
  previous_state?: string;
  new_state?: string;
  metadata_json?: Record<string, any>;
  timestamp: string;
}

export interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  metadata?: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface DashboardMetrics {
  total_cases: number;
  open_cases: number;
  pending_action: number;
  approaching_deadline: number;
  overdue_cases: number;
  resolved_closed: number;
  by_bureau: Record<string, number>;
  by_status: Record<string, number>;
}

export interface BureauWorkloadStat {
  bureau_id: string;
  bureau_code: string;
  bureau_name: string;
  total_cases: number;
  open_cases: number;
  overdue_cases: number;
  approaching_cases: number;
  resolved_cases: number;
  resolution_rate_pct: number;
}

export interface StageDwellTimeStat {
  stage: string;
  count: number;
  avg_hours: number;
  avg_days: number;
  min_hours: number;
  max_hours: number;
  is_bottleneck: boolean;
}

export interface ExecutiveKPIs {
  total_cases: number;
  open_cases: number;
  pending_action: number;
  approaching_deadline: number;
  overdue_cases: number;
  resolved_closed: number;
  resolution_rate_pct: number;
}

export interface DashboardOverview {
  kpis: ExecutiveKPIs;
  by_bureau: BureauWorkloadStat[];
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
}

export interface BottleneckAnalysis {
  stages: StageDwellTimeStat[];
  primary_bottleneck_stage?: string | null;
  system_health_status: string;
  operational_advisory?: string | null;
}

export type SlaRiskLevel = "ON_TRACK" | "APPROACHING" | "OVERDUE" | "COMPLETED";

export interface CaseFilterParams {
  page?: number;
  page_size?: number;
  bureau_id?: string;
  institution_id?: string;
  status?: string;
  priority?: string;
  search?: string;
  sort_by?: "created_at" | "due_date" | "priority" | "status" | "subject";
  sort_dir?: "asc" | "desc";
}

export interface CaseNote {
  id: string;
  case_id: string;
  author_id: string;
  content: string;
  is_confidential: boolean;
  created_at: string;
  author?: UserSummary;
}

export interface CaseAssignmentHistory {
  id: string;
  case_id: string;
  from_bureau_id?: string;
  to_bureau_id: string;
  assigned_by_id?: string;
  transfer_reason: string;
  created_at: string;
  from_bureau?: Bureau;
  to_bureau?: Bureau;
  assigned_by?: UserSummary;
}

export interface SlaRadarItem {
  case_reference_id: string;
  subject: string;
  category: string;
  priority: CasePriority;
  status: CaseStatus;
  bureau_code?: string;
  bureau_name?: string;
  institution_name?: string;
  due_date?: string;
  escalation_level: number;
  sla_status: string;
  hours_remaining?: number;
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

export interface CsvRowError {
  row_number: number;
  field: string;
  message: string;
}

export interface CsvRowPreview {
  row_number: number;
  is_valid: boolean;
  institution_aicte_id: string;
  institution_name?: string | null;
  bureau_code: string;
  bureau_name?: string | null;
  subject: string;
  category: string;
  priority: string;
  is_confidential: boolean;
  description: string;
  errors: CsvRowError[];
  warnings: string[];
  duplicate_case_ref?: string | null;
}

export interface CsvPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  can_commit: boolean;
  rows: CsvRowPreview[];
}

export interface CsvCommitResponse {
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_case_references: string[];
}

// -------------------------------------------------------------
// Phase 8: Explainable AI Intelligence & Duplicate Detection Types
// -------------------------------------------------------------

export interface DuplicateMatch {
  case_reference_id: string;
  subject: string;
  institution_name: string;
  institution_aicte_id: string;
  bureau_code: string;
  bureau_name: string;
  similarity_score: number;
  matched_keywords: string[];
  status: string;
  created_at: string;
}

export interface DuplicateCheckRequest {
  subject: string;
  description: string;
  institution_aicte_id?: string | null;
  exclude_case_ref?: string | null;
  threshold?: number;
}

export interface DuplicateCheckResponse {
  total_evaluated: number;
  matches_found: number;
  highest_similarity: number;
  has_potential_duplicate: boolean;
  matches: DuplicateMatch[];
}

export interface TriageRationaleItem {
  category: string;
  title: string;
  explanation: string;
  weight: number;
  matched_tokens: string[];
}

export interface TriageSuggestRequest {
  subject: string;
  description: string;
  institution_aicte_id?: string | null;
  current_category?: string | null;
}

export interface TriageSuggestion {
  recommended_bureau_id: string;
  recommended_bureau_code: string;
  recommended_bureau_name: string;
  recommended_category: string;
  recommended_priority: string;
  confidence_score: number;
  rationales: TriageRationaleItem[];
}

export interface TriageApplyRequest {
  case_reference_id: string;
  bureau_id?: string | null;
  category?: string | null;
  priority?: string | null;
  justification?: string | null;
}

export interface TriageApplyResponse {
  case_reference_id: string;
  bureau_code: string;
  bureau_name: string;
  category: string;
  priority: string;
  status: string;
  audit_event_id: string;
  applied_at: string;
}

// -------------------------------------------------------------
// Magic Zero-Shot Grievance Ingestion Types
// -------------------------------------------------------------

export interface ExtractedInstitution {
  name: string;
  id?: string | null;
  aicte_permanent_id?: string | null;
  state?: string | null;
  district?: string | null;
  confidence: number;
  is_database_match: boolean;
  matched_phrase: string;
}

export interface CategorizationResult {
  category: string;
  confidence: number;
  detected_signals: string[];
}

export interface PriorityAssignment {
  priority: CasePriority | string;
  urgency_signals: string[];
  sla_hours: number;
  rationale: string;
}

export interface BureauRouting {
  bureau_id: string;
  bureau_code: string;
  bureau_name: string;
  confidence: number;
  routing_rationale: string;
  all_scores: Record<string, number>;
  key_evidence_tokens: string[];
}

export interface MagicAnalysisResult {
  extracted_college: ExtractedInstitution;
  categorization: CategorizationResult;
  priority_assignment: PriorityAssignment;
  bureau_routing: BureauRouting;
  generated_subject: string;
  summary_insight: string;
}

export interface MagicIngestRequest {
  grievance_text: string;
  student_name?: string | null;
  student_email?: string | null;
  student_phone?: string | null;
  auto_docket?: boolean;
}

export interface MagicIngestResponse {
  analysis: MagicAnalysisResult;
  case_created: boolean;
  case_reference_id?: string | null;
  case_id?: string | null;
  status?: string | null;
  due_date?: string | null;
  created_at?: string | null;
  docket_message: string;
}
