/**
 * Public API — routes calls to mock handlers or the real HTTP client.
 * Controlled by the VITE_USE_MOCKS env variable (default: true).
 *
 * UI components import ONLY from this file.
 * Never call fetch directly in components or hooks.
 */

import type {
  ComplaintCase,
  ListCasesParams,
  ListCasesResponse,
  TimelineEntry,
  Note,
  AssignmentHistoryEntry,
  Bureau,
  Officer,
  SlaRadarSummary,
  DashboardStats,
  CsvPreviewResult,
  CsvCommitResult,
  CurrentUser,
  TransitionCaseParams,
  AssignCaseParams,
  EscalateParams,
  AddNoteParams,
  TriageResult,
  DuplicateMatch,
  ApiError,
} from "@/types/ui";
import type { CsvRowResult } from "@/types/ui";

// Mock handlers
import {
  mockSwitchRole,
  mockGetMe,
  mockListBureaus,
  mockListOfficers,
  mockListCases,
  mockGetCase,
  mockTransitionCase,
  mockAssignCase,
  mockEscalateCase,
  mockAddNote,
  mockGetNotes,
  mockGetTimeline,
  mockGetAssignmentHistory,
  mockGetDashboardStats,
  mockGetSlaRadar,
  mockRunTriage,
  mockCheckDuplicates,
  mockApplyTriage,
  mockPreviewCsv,
  mockCommitCsv,
} from "./mock/handlers";

// Real API client + adapters
import {
  getStandard,
  getPaginated,
  post,
  postForm,
  buildUrl,
  setDemoRole,
  setAuthToken,
} from "./client";
import { ENDPOINTS } from "./endpoints";
import {
  adaptCase,
  adaptCases,
  adaptTimeline,
  adaptTimelineList,
  adaptNote,
  adaptNotes,
  adaptAssignmentHistoryList,
  adaptBureaus,
  adaptOfficers,
  adaptSlaRadar,
  adaptCsvPreview,
  adaptCsvCommit,
  adaptCurrentUser,
} from "./adapters";

// ─── Environment switch ────────────────────────────────────────────────────────

export const USE_MOCKS: boolean =
  (import.meta.env.VITE_USE_MOCKS as string | undefined)?.toLowerCase() !== "false";

// ─── Internal: current role (mock mode) ──────────────────────────────────────

let _mockRole = "SUPERVISOR";
let _mockBureauId: string | null = null;

export function setMockRole(role: string, bureauId?: string | null) {
  _mockRole = role;
  _mockBureauId = bureauId ?? null;
}

export function getMockRole(): string {
  return _mockRole;
}

// ─── Helper to throw ApiError from client result ──────────────────────────────

function unwrap<T>(result: { data: T | null; error: ApiError | null }): T {
  if (result.error) throw result.error;
  if (result.data === null) throw { code: "EMPTY_RESPONSE", message: "Empty response from server" } as ApiError;
  return result.data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Switch demo role. In live mode this calls switch-demo-role and stores the JWT. */
export async function switchRole(role: string): Promise<CurrentUser> {
  if (USE_MOCKS) {
    const user = await mockSwitchRole(role);
    setMockRole(role, user.bureau_id);
    return user;
  }
  const result = await getStandard<{ user: Record<string, unknown>; token: string }>(
    ENDPOINTS.switchDemoRole(role),
  );
  const raw = unwrap(result);
  if (raw.data?.token) {
    setAuthToken(raw.data.token as string);
  }
  return adaptCurrentUser(raw.data!.user as Parameters<typeof adaptCurrentUser>[0]);
}

export async function getMe(role?: string): Promise<CurrentUser> {
  if (USE_MOCKS) return mockGetMe(role ?? _mockRole);

  if (role) setDemoRole(role);
  const result = await getStandard<Parameters<typeof adaptCurrentUser>[0]>(ENDPOINTS.me);
  return adaptCurrentUser(unwrap(result).data!);
}

// ─── Bureaus ──────────────────────────────────────────────────────────────────

export async function listBureaus(): Promise<Bureau[]> {
  if (USE_MOCKS) return mockListBureaus();
  const result = await getStandard<Parameters<typeof adaptBureaus>[0]>(ENDPOINTS.bureaus);
  return adaptBureaus(unwrap(result).data ?? []);
}

export const getBureaus = listBureaus;

export async function listOfficers(bureauId: string): Promise<Officer[]> {
  if (USE_MOCKS) return mockListOfficers(bureauId);
  const result = await getStandard<Parameters<typeof adaptOfficers>[0]>(ENDPOINTS.bureauOfficers(bureauId));
  return adaptOfficers(unwrap(result).data ?? []);
}

// ─── Cases ────────────────────────────────────────────────────────────────────

export async function listCases(params: ListCasesParams = {}): Promise<ListCasesResponse> {
  if (USE_MOCKS) return mockListCases(params, _mockRole, _mockBureauId);

  const url = buildUrl(ENDPOINTS.cases, {
    bureau_id: params.bureau_id,
    institution_id: params.institution_id,
    status: params.status,
    priority: params.priority,
    search: params.search,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    page: params.page,
    page_size: params.page_size,
  });

  const result = await getPaginated<Parameters<typeof adaptCase>[0]>(url);
  const raw = unwrap(result);
  return {
    items: adaptCases(raw.data),
    total: raw.metadata.total_records,
    page: raw.metadata.page,
    page_size: raw.metadata.page_size,
    total_pages: raw.metadata.total_pages,
  };
}

export async function getCase(caseRef: string): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockGetCase(caseRef, _mockRole);
  const result = await getStandard<Parameters<typeof adaptCase>[0]>(ENDPOINTS.caseDetail(caseRef));
  return adaptCase(unwrap(result).data!);
}

export async function transitionCase(params: TransitionCaseParams): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockTransitionCase(params, _mockRole, _mockBureauId);
  const result = await post<Parameters<typeof adaptCase>[0]>(
    ENDPOINTS.caseTransition(params.case_ref),
    { to_status: params.to_status, remarks: params.remarks },
  );
  return adaptCase(unwrap(result).data!);
}

export async function assignCase(params: AssignCaseParams): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockAssignCase(params, _mockRole);
  const result = await post<Parameters<typeof adaptCase>[0]>(
    ENDPOINTS.caseAssign(params.case_ref),
    { to_bureau_id: params.to_bureau_id, to_officer_id: params.to_officer_id, reason: params.reason },
  );
  return adaptCase(unwrap(result).data!);
}

export async function escalateCase(params: EscalateParams): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockEscalateCase(params, _mockRole);
  const result = await post<Parameters<typeof adaptCase>[0]>(
    ENDPOINTS.caseEscalate(params.case_ref),
    { reason: params.reason },
  );
  return adaptCase(unwrap(result).data!);
}

// ─── Timeline / Notes / History ───────────────────────────────────────────────

export async function getTimeline(caseRef: string): Promise<TimelineEntry[]> {
  if (USE_MOCKS) return mockGetTimeline(caseRef);
  const result = await getStandard<Parameters<typeof adaptTimelineList>[0]>(ENDPOINTS.caseTimeline(caseRef));
  return adaptTimelineList(unwrap(result).data ?? []);
}

export async function getNotes(caseRef: string): Promise<Note[]> {
  if (USE_MOCKS) return mockGetNotes(caseRef, _mockRole);
  const result = await getStandard<Parameters<typeof adaptNotes>[0]>(ENDPOINTS.caseNotes(caseRef));
  const notes = adaptNotes(unwrap(result).data ?? []);
  // AUDITOR confidential note guard (backend gap — handled client-side)
  if (_mockRole === "AUDITOR") {
    return notes.map((n) =>
      n.is_confidential ? { ...n, content: "[Confidential — not visible to Auditor]" } : n,
    );
  }
  return notes;
}

export async function addNote(params: AddNoteParams): Promise<Note> {
  if (USE_MOCKS) return mockAddNote(params, _mockRole);
  const result = await post<Parameters<typeof adaptNote>[0]>(
    ENDPOINTS.caseNotes(params.case_ref),
    { content: params.content, is_confidential: params.is_confidential },
  );
  return adaptNote(unwrap(result).data!);
}

export async function getAssignmentHistory(caseRef: string): Promise<AssignmentHistoryEntry[]> {
  if (USE_MOCKS) return mockGetAssignmentHistory(caseRef);
  const result = await getStandard<Parameters<typeof adaptAssignmentHistoryList>[0]>(
    ENDPOINTS.caseAssignmentHistory(caseRef),
  );
  return adaptAssignmentHistoryList(unwrap(result).data ?? []);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) return mockGetDashboardStats(_mockRole, _mockBureauId);
  const result = await getStandard<DashboardStats>(ENDPOINTS.dashboard);
  return unwrap(result).data!;
}

// ─── SLA Radar ────────────────────────────────────────────────────────────────

export async function getSlaRadar(bureauId?: string): Promise<SlaRadarSummary> {
  const effectiveBureau = _mockRole === "OFFICER" ? _mockBureauId : (bureauId === "ALL" ? undefined : bureauId);
  if (USE_MOCKS) return mockGetSlaRadar(_mockRole, effectiveBureau);
  const url = buildUrl(ENDPOINTS.slaRadar, { bureau_id: effectiveBureau });
  const result = await getStandard<Parameters<typeof adaptSlaRadar>[0]>(url);
  return adaptSlaRadar(unwrap(result).data!);
}

// ─── Smart Triage ─────────────────────────────────────────────────────────────

export async function runTriage(text: string): Promise<TriageResult> {
  if (USE_MOCKS) return mockRunTriage(text);
  const result = await post<TriageResult>(ENDPOINTS.aiTriage, { text });
  return unwrap(result).data!;
}

export async function checkDuplicates(query: {
  subject: string;
  description: string;
  institution_name?: string;
}): Promise<DuplicateMatch[]> {
  if (USE_MOCKS) return mockCheckDuplicates(query);
  const result = await post<{ matches: DuplicateMatch[] }>(ENDPOINTS.aiDuplicates, query);
  return unwrap(result).data?.matches ?? [];
}

export async function applyTriage(
  caseRef: string,
  result: TriageResult,
): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockApplyTriage(caseRef, result, _mockRole);
  const res = await post<Parameters<typeof adaptCase>[0]>(
    ENDPOINTS.caseTransition(caseRef), // Assumed: triage apply goes via transition
    {
      to_bureau_id: result.recommended_bureau_code,
      category: result.recommended_category,
      priority: result.recommended_priority,
    },
  );
  return adaptCase(unwrap(res).data!);
}

// ─── CSV Ingestion ────────────────────────────────────────────────────────────

export async function previewCsv(csvContent: string): Promise<CsvPreviewResult> {
  if (USE_MOCKS) return mockPreviewCsv(csvContent);

  const formData = new FormData();
  const blob = new Blob([csvContent], { type: "text/csv" });
  formData.append("file", blob, "upload.csv");

  const result = await postForm<Parameters<typeof adaptCsvPreview>[0]>(ENDPOINTS.csvPreview, formData);
  return adaptCsvPreview(unwrap(result).data!);
}

export async function commitCsv(rows: CsvRowResult[]): Promise<CsvCommitResult> {
  if (USE_MOCKS) return mockCommitCsv(rows, _mockRole);
  const result = await post<Parameters<typeof adaptCsvCommit>[0]>(ENDPOINTS.csvCommit, {
    rows,
    skip_invalid: true,
  });
  return adaptCsvCommit(unwrap(result).data!);
}
