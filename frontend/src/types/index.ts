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
