/**
 * HTTP client — the ONLY place in the codebase that calls fetch().
 *
 * Responsibilities:
 * - Attaches auth headers (JWT Bearer OR X-Demo-Role for live demo mode).
 * - Normalises all error shapes into ApiError (handles both StandardResponse
 *   and raw FastAPI HTTPException { "detail": ... } shapes).
 * - Never throws on 4xx/5xx — returns { data, error } discriminated union
 *   so callers don't need try/catch.
 */

import type {
  StandardResponse,
  PaginatedResponse,
  RawHttpException,
  ApiErrorInfo,
} from "@/types/api";
import type { ApiError } from "@/types/ui";

// ─── Auth token store (in-memory, not persisted) ──────────────────────────────

let _bearerToken: string | null = null;
let _demoRole: string | null = null;

export function setAuthToken(token: string | null) {
  _bearerToken = token;
  _demoRole = null;
}

export function setDemoRole(role: string | null) {
  _demoRole = role;
  _bearerToken = null;
}

export function getAuthHeaders(): HeadersInit {
  if (_bearerToken) {
    return { Authorization: `Bearer ${_bearerToken}` };
  }
  if (_demoRole) {
    // Backend accepts X-Demo-Role header for role simulation (no token needed)
    return { "X-Demo-Role": _demoRole };
  }
  // No auth: backend defaults to SUPERVISOR if unseeded, or returns 500 if unseeded
  return {};
}

// ─── Error normalisation ──────────────────────────────────────────────────────

function normaliseError(
  status: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
): ApiError {
  // Shape 1: StandardResponse wrapper
  if (body?.error && typeof body.error === "object") {
    const e = body.error as ApiErrorInfo;
    return { code: e.code, message: e.message, status, details: e.details };
  }
  // Shape 2: FastAPI HTTPException { "detail": ... }
  if (body?.detail !== undefined) {
    const d = (body as RawHttpException).detail;
    if (typeof d === "string") {
      return { code: "API_ERROR", message: d, status };
    }
    return {
      code: d.code ?? "API_ERROR",
      message: d.message ?? "An error occurred.",
      status,
      details: d,
    };
  }
  // Shape 3: Unknown
  return {
    code: "UNKNOWN_ERROR",
    message: typeof body === "string" ? body : "An unexpected error occurred.",
    status,
  };
}

// ─── Core request function ────────────────────────────────────────────────────

export type ClientResult<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<ClientResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    let body: unknown;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (!res.ok) {
      return { data: null, error: normaliseError(res.status, body) };
    }

    return { data: body as T, error: null };
  } catch (err) {
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Cannot reach the server. Check that the backend is running."
        : (err instanceof Error ? err.message : "Network error");
    return { data: null, error: { code: "NETWORK_ERROR", message } };
  }
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export async function getStandard<T>(
  url: string,
  options?: RequestInit,
): Promise<ClientResult<StandardResponse<T>>> {
  return request<StandardResponse<T>>(url, options);
}

export async function getPaginated<T>(
  url: string,
  options?: RequestInit,
): Promise<ClientResult<PaginatedResponse<T>>> {
  return request<PaginatedResponse<T>>(url, options);
}

export async function post<T>(
  url: string,
  body: unknown,
  options?: RequestInit,
): Promise<ClientResult<StandardResponse<T>>> {
  return request<StandardResponse<T>>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function postForm<T>(
  url: string,
  formData: FormData,
): Promise<ClientResult<StandardResponse<T>>> {
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(), // Note: no Content-Type for multipart
    body: formData,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  if (!res.ok) {
    return { data: null, error: normaliseError(res.status, body) };
  }

  return { data: body as StandardResponse<T>, error: null };
}

/** Build a URL with query params, omitting undefined/null values. */
export function buildUrl(
  base: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const url = new URL(base);
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.set(key, String(val));
    }
  }
  return url.toString();
}
