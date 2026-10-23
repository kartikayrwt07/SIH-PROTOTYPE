import { StandardResponse, ComplaintCase, DashboardMetrics, UserRole, UserSummary, CaseStatus, TimelineEvent } from "../types";

const API_BASE = "/api/v1";

export interface UserProfileResponse extends UserSummary {
  bureau_name?: string;
  bureau_code?: string;
  permissions: string[];
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<StandardResponse<T>> {
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
      };
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

  async getCases(params?: {
    bureau_id?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<StandardResponse<ComplaintCase[]>> {
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

  async getDashboardMetrics(): Promise<StandardResponse<DashboardMetrics>> {
    return this.request("/dashboard/metrics");
  }
}

export const api = new ApiService();
