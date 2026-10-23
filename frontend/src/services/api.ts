import { StandardResponse, ComplaintCase, DashboardMetrics } from "../types";

const API_BASE = "/api/v1";

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<StandardResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
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

  async getDashboardMetrics(): Promise<StandardResponse<DashboardMetrics>> {
    return this.request("/dashboard/metrics");
  }
}

export const api = new ApiService();
