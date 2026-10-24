import {
  StandardResponse,
  PaginatedResponse,
  ComplaintCase,
  DashboardMetrics,
  UserRole,
  UserSummary,
  CaseStatus,
  TimelineEvent,
  Bureau,
  CaseFilterParams,
  CaseNote,
  CaseAssignmentHistory,
  SlaRadarSummary,
  BureauWorkloadStat,
  DashboardOverview,
  BottleneckAnalysis,
  CsvPreviewResponse,
  CsvCommitResponse,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  TriageSuggestRequest,
  TriageSuggestion,
  TriageApplyRequest,
  TriageApplyResponse,
  MagicAnalysisResult,
  MagicIngestRequest,
  MagicIngestResponse,
  AutoDetectResponse,
  CreateMasterTicketRequest,
  CreateMasterTicketResponse,
  ResolveMasterTicketRequest,
  ResolveMasterTicketResponse,
  MasterTicketRead,
  MasterTicketSummary,
  MasterTicketStats,
  InstitutionPerformanceStat,
} from "../types";

const API_BASE = "/api/v1";

export interface UserProfileResponse extends UserSummary {
  bureau_name?: string;
  bureau_code?: string;
  permissions: string[];
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const token = localStorage.getItem("aicte_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        const activeRole = localStorage.getItem("aicte_demo_role") || "SUPERVISOR";
        headers["X-Demo-Role"] = activeRole;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        cache: "no-store",
        headers: {
          ...headers,
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: err instanceof Error ? err.message : "Unable to connect to backend service",
        },
      } as unknown as T;
    }
  }

  async checkHealth(): Promise<StandardResponse<{ status: string; service: string; database: string }>> {
    return this.request("/health");
  }

  async login(credentials: { email: string; password: string }): Promise<StandardResponse<{ access_token: string; token_type: string }>> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(payload: {
    full_name: string;
    email: string;
    password: string;
    role?: UserRole;
    bureau_id?: string;
  }): Promise<StandardResponse<{ access_token: string; token_type: string }>> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getCurrentUser(tokenOverride?: string): Promise<StandardResponse<UserProfileResponse>> {
    const headers: Record<string, string> = {};
    if (tokenOverride) {
      headers["Authorization"] = `Bearer ${tokenOverride}`;
    }
    return this.request("/auth/me", { headers });
  }

  async switchDemoRole(role: UserRole): Promise<StandardResponse<{ user: any; token: string }>> {
    return this.request(`/auth/switch-demo-role/${role}`);
  }

  async getBureaus(): Promise<StandardResponse<Bureau[]>> {
    return this.request("/bureaus");
  }

  async getCases(params?: CaseFilterParams): Promise<PaginatedResponse<ComplaintCase>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/cases${qs}`);
  }

  async getCaseDetail(caseRef: string): Promise<StandardResponse<ComplaintCase>> {
    return this.request(`/cases/${caseRef}`);
  }

  async transitionCase(
    caseRef: string,
    toStatus: CaseStatus,
    remarks: string
  ): Promise<StandardResponse<ComplaintCase>> {
    return this.request(`/cases/${caseRef}/transition`, {
      method: "POST",
      body: JSON.stringify({ to_status: toStatus, remarks }),
    });
  }

  async reopenCase(caseRef: string, reason: string): Promise<StandardResponse<ComplaintCase>> {
    return this.request(`/cases/${caseRef}/reopen?reason=${encodeURIComponent(reason)}`, {
      method: "POST",
    });
  }

  async getCaseTimeline(caseRef: string): Promise<StandardResponse<TimelineEvent[]>> {
    return this.request(`/cases/${caseRef}/timeline`);
  }

  async getCaseNotes(caseRef: string): Promise<StandardResponse<CaseNote[]>> {
    return this.request(`/cases/${caseRef}/notes`);
  }

  async addCaseNote(
    caseRef: string,
    content: string,
    is_confidential: boolean = false
  ): Promise<StandardResponse<CaseNote>> {
    return this.request(`/cases/${caseRef}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, is_confidential }),
    });
  }

  async getDashboardMetrics(): Promise<StandardResponse<DashboardMetrics>> {
    return this.request("/dashboard/metrics");
  }

  async getDashboardOverview(bureauId?: string): Promise<StandardResponse<DashboardOverview>> {
    const qs = bureauId ? `?bureau_id=${encodeURIComponent(bureauId)}` : "";
    return this.request(`/dashboard/metrics${qs}`);
  }

  async getBottleneckAnalysis(bureauId?: string): Promise<StandardResponse<BottleneckAnalysis>> {
    const qs = bureauId ? `?bureau_id=${encodeURIComponent(bureauId)}` : "";
    return this.request(`/dashboard/bottlenecks${qs}`);
  }

  async getBureauWorkload(): Promise<StandardResponse<BureauWorkloadStat[]>> {
    return this.request("/dashboard/workload");
  }

  async getInstitutionPerformance(params?: {
    state?: string;
    intervention_status?: string;
  }): Promise<StandardResponse<InstitutionPerformanceStat[]>> {
    const searchParams = new URLSearchParams();
    if (params?.state && params.state !== "ALL") {
      searchParams.append("state", params.state);
    }
    if (params?.intervention_status && params.intervention_status !== "ALL") {
      searchParams.append("intervention_status", params.intervention_status);
    }
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request(`/dashboard/institutions${qs}`);
  }

  async getBureauOfficers(bureauId: string): Promise<StandardResponse<UserSummary[]>> {
    return this.request(`/bureaus/${bureauId}/officers`);
  }

  async assignCase(
    caseRef: string,
    toBureauId: string,
    toOfficerId: string | undefined,
    reason: string
  ): Promise<StandardResponse<ComplaintCase>> {
    return this.request(`/cases/${caseRef}/assign`, {
      method: "POST",
      body: JSON.stringify({
        to_bureau_id: toBureauId,
        to_officer_id: toOfficerId || null,
        reason,
      }),
    });
  }

  async getCaseAssignmentHistory(caseRef: string): Promise<StandardResponse<CaseAssignmentHistory[]>> {
    return this.request(`/cases/${caseRef}/assignment-history`);
  }

  async getSlaRadar(bureauId?: string): Promise<StandardResponse<SlaRadarSummary>> {
    const qs = bureauId ? `?bureau_id=${encodeURIComponent(bureauId)}` : "";
    return this.request(`/cases/sla/radar${qs}`);
  }

  async escalateCase(caseRef: string, reason: string): Promise<StandardResponse<ComplaintCase>> {
    return this.request(`/cases/${caseRef}/escalate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async previewCsv(csvContent: string): Promise<StandardResponse<CsvPreviewResponse>> {
    return this.request("/cases/import/preview", {
      method: "POST",
      body: JSON.stringify({ csv_content: csvContent }),
    });
  }

  async commitCsvBatch(rows: any[], skipInvalid: boolean = true): Promise<StandardResponse<CsvCommitResponse>> {
    return this.request("/cases/import/commit", {
      method: "POST",
      body: JSON.stringify({ rows, skip_invalid: skipInvalid }),
    });
  }

  async exportCasesCsv(params?: CaseFilterParams): Promise<{ blob: Blob; filename: string }> {
    const token = localStorage.getItem("aicte_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      const activeRole = localStorage.getItem("aicte_demo_role") || "SUPERVISOR";
      headers["X-Demo-Role"] = activeRole;
    }

    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "" && key !== "page" && key !== "page_size") {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";

    const response = await fetch(`${API_BASE}/cases/export/csv${qs}`, {
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Export failed with status ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.error?.message) {
          errorMsg = errData.error.message;
        }
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorMsg);
    }

    let filename = `aicte_complaints_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.csv`;
    const disposition = response.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await response.blob();
    return { blob, filename };
  }

  // -------------------------------------------------------------
  // Phase 8: Explainable AI Intelligence & Duplicate Detection
  // -------------------------------------------------------------

  async checkDuplicates(payload: DuplicateCheckRequest): Promise<StandardResponse<DuplicateCheckResponse>> {
    return this.request("/ai/duplicates/check", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getCaseDuplicates(caseRef: string, threshold: number = 0.70): Promise<StandardResponse<DuplicateCheckResponse>> {
    return this.request(`/ai/duplicates/${caseRef}?threshold=${threshold}`);
  }

  async getTriageSuggestion(payload: TriageSuggestRequest): Promise<StandardResponse<TriageSuggestion>> {
    return this.request("/ai/triage/suggest", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getCaseTriageSuggestion(caseRef: string): Promise<StandardResponse<TriageSuggestion>> {
    return this.request(`/ai/triage/suggest/${caseRef}`);
  }

  async applyTriageSuggestion(payload: TriageApplyRequest): Promise<StandardResponse<TriageApplyResponse>> {
    return this.request("/ai/triage/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getCaseAttachments(caseRef: string): Promise<StandardResponse<import("../types").CaseAttachment[]>> {
    return this.request(`/cases/${caseRef}/attachments`);
  }

  async uploadCaseAttachment(caseRef: string, formData: FormData): Promise<StandardResponse<import("../types").CaseAttachment>> {
    const activeRole = localStorage.getItem("aicte_demo_role") || "SUPERVISOR";
    const headers: Record<string, string> = {
      "X-Demo-Role": activeRole,
    };
    const token = localStorage.getItem("aicte_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/cases/${caseRef}/attachments`, {
      method: "POST",
      headers,
      body: formData,
    });
    return await response.json();
  }

  // -------------------------------------------------------------
  // Complainant Identity & e-KYC Verification
  // -------------------------------------------------------------

  async sendVerificationOtp(payload: {
    full_name: string;
    target: string;
    method?: string;
    complainant_type?: string;
  }): Promise<StandardResponse<{ tx_ref: string; target_masked: string; expires_in_seconds: number; message: string; sandbox_otp?: string }>> {
    return this.request("/identity/otp/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async verifyOtp(payload: {
    tx_ref: string;
    otp_code: string;
  }): Promise<StandardResponse<{ verification_token: string; masked_identifier: string; full_name: string; complainant_type: string; verification_method: string }>> {
    return this.request("/identity/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // -------------------------------------------------------------
  // Magic Zero-Shot Grievance Ingestion
  // -------------------------------------------------------------

  async magicAnalyze(payload: MagicIngestRequest): Promise<StandardResponse<MagicAnalysisResult>> {
    return this.request("/cases/magic-analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async magicIngest(payload: MagicIngestRequest): Promise<StandardResponse<MagicIngestResponse>> {
    return this.request("/cases/magic-ingest", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // -------------------------------------------------------------
  // Smart Duplicate Grouping / Master Tickets
  // -------------------------------------------------------------

  async detectDuplicateGroups(payload: {
    institution_aicte_id?: string | null;
    category?: string | null;
    similarity_threshold?: number;
    min_group_size?: number;
  }): Promise<StandardResponse<AutoDetectResponse>> {
    return this.request("/ai/master-tickets/detect", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createMasterTicket(payload: CreateMasterTicketRequest): Promise<StandardResponse<CreateMasterTicketResponse>> {
    return this.request("/ai/master-tickets/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async resolveMasterTicket(ticketRef: string, payload: ResolveMasterTicketRequest): Promise<StandardResponse<ResolveMasterTicketResponse>> {
    return this.request(`/ai/master-tickets/${ticketRef}/resolve`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listMasterTickets(statusFilter?: string, bureauId?: string): Promise<StandardResponse<MasterTicketSummary[]>> {
    const query = new URLSearchParams();
    if (statusFilter) query.append("status", statusFilter);
    if (bureauId) query.append("bureau_id", bureauId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/ai/master-tickets/list${qs}`);
  }

  async getMasterTicketStats(): Promise<StandardResponse<MasterTicketStats>> {
    return this.request("/ai/master-tickets/stats");
  }

  async getMasterTicketDetail(ticketRef: string): Promise<StandardResponse<MasterTicketRead>> {
    return this.request(`/ai/master-tickets/${ticketRef}`);
  }
}

export const api = new ApiService();

