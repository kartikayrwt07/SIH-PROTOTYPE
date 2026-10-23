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
      const activeRole = localStorage.getItem("aicte_demo_role") || "SUPERVISOR";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Demo-Role": activeRole,
      };

      const token = localStorage.getItem("aicte_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
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

  async getCurrentUser(roleOverride?: UserRole): Promise<StandardResponse<UserProfileResponse>> {
    const headers: Record<string, string> = {};
    if (roleOverride) {
      headers["X-Demo-Role"] = roleOverride;
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

  async exportCasesCsv(params?: CaseFilterParams): Promise<Blob | null> {
    try {
      const activeRole = localStorage.getItem("aicte_demo_role") || "SUPERVISOR";
      const headers: Record<string, string> = {
        "X-Demo-Role": activeRole,
      };
      const token = localStorage.getItem("aicte_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
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
        return null;
      }
      return await response.blob();
    } catch {
      return null;
    }
  }
}

export const api = new ApiService();
