/**
 * Public API — routes calls to mock handlers or the real HTTP client.
 * Controlled by the VITE_USE_MOCKS env variable (default: false when backend configured).
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
  BureauCode,
  CasePriority,
  DuplicateMatch,
  ApiError,
  CaseAttachment,
  MasterTicket,
  DetectedGroup,
  MasterTicketStats,
  InstitutionTrustScore,
  TrustLeaderboardSummary,
  RegulatoryActionResponse,
  TelegramBotInfo,
  TelegramSimulateResponse,
  MagicAnalysisResult,
  MagicIngestResponse,
  BottleneckAnalysis,
  InstitutionPerformanceStat,
  CsvRowResult,
} from "@/types/ui";
import type {
  RawComplaintCase,
  RawTimelineEvent,
  RawCaseNote,
  RawAssignmentHistory,
  RawBureau,
  RawOfficer,
  RawSlaRadarSummary,
  RawCsvPreviewResponse,
  RawCsvCommitResponse,
  RawAuthUser,
  RawCaseAttachment,
  RawMasterTicketRead,
  RawMasterTicketSummary,
  RawAutoDetectResponse,
  RawMasterTicketStats,
  RawInstitutionTrustScoreDetail,
  RawTrustLeaderboardSummary,
  RawRegulatoryActionResponse,
  RawTelegramBotInfo,
  RawTelegramSimulateResponse,
  RawMagicAnalysisResult,
  RawMagicIngestResponse,
  RawDashboardOverview,
  RawBottleneckAnalysis,
  RawInstitutionPerformanceStat,
} from "@/types/api";

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
  adaptAttachment,
  adaptAttachments,
  adaptMasterTicket,
  adaptMasterTickets,
  adaptDetectedGroup,
  adaptMasterTicketStats,
  adaptTrustScoreDetail,
  adaptTrustLeaderboardSummary,
  adaptRegulatoryAction,
  adaptTelegramBotInfo,
  adaptTelegramSimulateResponse,
  adaptMagicAnalysisResult,
  adaptMagicIngestResponse,
  adaptDashboardStats,
  adaptBottleneckAnalysis,
  adaptInstitutionPerformanceStat,
} from "./adapters";

// ─── Environment switch ────────────────────────────────────────────────────────

export const USE_MOCKS: boolean =
  ((import.meta.env as Record<string, string | undefined>)["VITE_USE_MOCKS"])?.toLowerCase() === "true";

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
  if (result.data === null)
    throw { code: "EMPTY_RESPONSE", message: "Empty response from server" } as ApiError;
  return result.data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<CurrentUser> {
  const result = await post<{ access_token: string; token_type: string; user?: RawAuthUser }>(
    ENDPOINTS.login,
    { email, password },
  );
  const raw = unwrap(result);
  if (raw.data?.access_token) {
    setAuthToken(raw.data.access_token);
  }
  return getMe();
}

/** Switch demo role. In live mode this calls switch-demo-role and stores the JWT. */
export async function switchRole(role: string, bureauId?: string | undefined): Promise<CurrentUser> {
  if (USE_MOCKS) {
    const user = await mockSwitchRole(role, bureauId);
    setMockRole(role, user.bureau_id);
    return user;
  }
  const result = await getStandard<{ user: RawAuthUser; token: string }>(
    ENDPOINTS.switchDemoRole(role),
  );
  const raw = unwrap(result);
  if (raw.data?.token) {
    setAuthToken(raw.data.token);
  }
  return adaptCurrentUser(raw.data!.user);
}

export async function getMe(role?: string): Promise<CurrentUser> {
  if (USE_MOCKS) return mockGetMe(role ?? _mockRole);

  if (role) setDemoRole(role);
  const result = await getStandard<RawAuthUser>(ENDPOINTS.me);
  return adaptCurrentUser(unwrap(result).data!);
}

// ─── Bureaus ──────────────────────────────────────────────────────────────────

export async function listBureaus(): Promise<Bureau[]> {
  if (USE_MOCKS) return mockListBureaus();
  const result = await getStandard<RawBureau[]>(ENDPOINTS.bureaus);
  return adaptBureaus(unwrap(result).data ?? []);
}

export const getBureaus = listBureaus;

export async function listOfficers(bureauId: string): Promise<Officer[]> {
  if (USE_MOCKS) return mockListOfficers(bureauId);
  const result = await getStandard<RawOfficer[]>(ENDPOINTS.bureauOfficers(bureauId));
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

  const result = await getPaginated<RawComplaintCase>(url);
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
  const result = await getStandard<RawComplaintCase>(ENDPOINTS.caseDetail(caseRef));
  return adaptCase(unwrap(result).data!);
}

export async function transitionCase(params: TransitionCaseParams): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockTransitionCase(params, _mockRole, _mockBureauId);
  const result = await post<RawComplaintCase>(
    ENDPOINTS.caseTransition(params.case_ref),
    { to_status: params.to_status, remarks: params.remarks },
  );
  return adaptCase(unwrap(result).data!);
}

export async function assignCase(params: AssignCaseParams): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockAssignCase(params, _mockRole);
  const result = await post<RawComplaintCase>(
    ENDPOINTS.caseAssign(params.case_ref),
    { to_bureau_id: params.to_bureau_id, to_officer_id: params.to_officer_id, reason: params.reason },
  );
  return adaptCase(unwrap(result).data!);
}

export async function escalateCase(params: EscalateParams): Promise<ComplaintCase> {
  if (USE_MOCKS) return mockEscalateCase(params, _mockRole);
  const result = await post<RawComplaintCase>(
    ENDPOINTS.caseEscalate(params.case_ref),
    { reason: params.reason },
  );
  return adaptCase(unwrap(result).data!);
}

export async function reopenCase(caseRef: string, reason: string): Promise<ComplaintCase> {
  if (USE_MOCKS) {
    return mockTransitionCase({ case_ref: caseRef, to_status: "In Progress", remarks: reason }, _mockRole, _mockBureauId);
  }
  const result = await post<RawComplaintCase>(ENDPOINTS.caseReopen(caseRef, reason), {});
  return adaptCase(unwrap(result).data!);
}

export async function rejectCase(caseRef: string, reason: string): Promise<ComplaintCase> {
  if (USE_MOCKS) {
    return mockTransitionCase({ case_ref: caseRef, to_status: "Closed", remarks: `Rejected: ${reason}` }, _mockRole, _mockBureauId);
  }
  const result = await post<RawComplaintCase>(ENDPOINTS.caseReject(caseRef, reason), {});
  return adaptCase(unwrap(result).data!);
}

// ─── Timeline / Notes / History / Attachments ─────────────────────────────────

export async function getTimeline(caseRef: string): Promise<TimelineEntry[]> {
  if (USE_MOCKS) return mockGetTimeline(caseRef);
  const result = await getStandard<RawTimelineEvent[]>(ENDPOINTS.caseTimeline(caseRef));
  return adaptTimelineList(unwrap(result).data ?? []);
}

export async function getNotes(caseRef: string): Promise<Note[]> {
  if (USE_MOCKS) return mockGetNotes(caseRef, _mockRole);
  const result = await getStandard<RawCaseNote[]>(ENDPOINTS.caseNotes(caseRef));
  const notes = adaptNotes(unwrap(result).data ?? []);
  if (_mockRole === "AUDITOR") {
    return notes.map((n) =>
      n.is_confidential ? { ...n, content: "[Confidential — not visible to Auditor]" } : n,
    );
  }
  return notes;
}

export async function addNote(params: AddNoteParams): Promise<Note> {
  if (USE_MOCKS) return mockAddNote(params, _mockRole);
  const result = await post<RawCaseNote>(
    ENDPOINTS.caseNotes(params.case_ref),
    { content: params.content, is_confidential: params.is_confidential },
  );
  return adaptNote(unwrap(result).data!);
}

export async function getAssignmentHistory(caseRef: string): Promise<AssignmentHistoryEntry[]> {
  if (USE_MOCKS) return mockGetAssignmentHistory(caseRef);
  const result = await getStandard<RawAssignmentHistory[]>(
    ENDPOINTS.caseAssignmentHistory(caseRef),
  );
  return adaptAssignmentHistoryList(unwrap(result).data ?? []);
}

export async function getAttachments(caseRef: string): Promise<CaseAttachment[]> {
  if (USE_MOCKS) {
    return [
      {
        id: "att-mock-1",
        case_id: "case-01",
        file_name: "Hostel_Inspection_Report.pdf",
        file_size_bytes: 2450000,
        mime_type: "application/pdf",
        storage_path: "cases/case-01/Hostel_Inspection_Report.pdf",
        storage_bucket: "aicte-case-evidence",
        storage_provider: "supabase",
        secure_url: "https://rocrtbthsbdkwikatjjf.supabase.co/storage/v1/object/public/aicte-case-evidence/sample.pdf",
        category: "INSPECTION_REPORT",
        description: "Official on-site hostel sanitation and security check",
        is_confidential: false,
        scan_status: "CLEAN",
        sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        created_at: new Date().toISOString(),
      },
    ];
  }
  const result = await getStandard<RawCaseAttachment[]>(ENDPOINTS.caseAttachments(caseRef));
  return adaptAttachments(unwrap(result).data ?? []);
}

export async function uploadAttachment(
  caseRef: string,
  file: File,
  category = "EVIDENCE",
  description?: string,
  isConfidential = false,
): Promise<CaseAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  if (description) formData.append("description", description);
  formData.append("is_confidential", String(isConfidential));

  const result = await postForm<RawCaseAttachment>(ENDPOINTS.caseAttachments(caseRef), formData);
  return adaptAttachment(unwrap(result).data!);
}

// ─── Dashboard & Analytics ────────────────────────────────────────────────────

export async function getDashboardStats(
  bureauId?: string,
  institutionId?: string,
): Promise<DashboardStats> {
  if (USE_MOCKS) return mockGetDashboardStats(_mockRole, bureauId ?? _mockBureauId);
  const url = buildUrl(ENDPOINTS.dashboardMetrics, {
    bureau_id: bureauId === "ALL" ? undefined : bureauId,
    institution_id: institutionId === "ALL" ? undefined : institutionId,
  });
  const result = await getStandard<RawDashboardOverview>(url);
  return adaptDashboardStats(unwrap(result).data!);
}

export async function getBottleneckAnalysis(
  bureauId?: string,
  institutionId?: string,
): Promise<BottleneckAnalysis> {
  if (USE_MOCKS) {
    return {
      stage_dwell_times: [
        { stage: "Under Triage", avg_dwell_hours: 18.4, case_count: 14, exceeds_threshold: false },
        { stage: "Awaiting Information", avg_dwell_hours: 84.2, case_count: 8, exceeds_threshold: true },
        { stage: "Under Review", avg_dwell_hours: 32.1, case_count: 12, exceeds_threshold: false },
      ],
      critical_bottleneck_stage: "Awaiting Information",
      analysis_summary: "Awaiting Information dwell time exceeds statutory 72h benchmark by 12.2h.",
    };
  }
  const url = buildUrl(ENDPOINTS.dashboardBottlenecks, {
    bureau_id: bureauId === "ALL" ? undefined : bureauId,
    institution_id: institutionId === "ALL" ? undefined : institutionId,
  });
  const result = await getStandard<RawBottleneckAnalysis>(url);
  return adaptBottleneckAnalysis(unwrap(result).data!);
}

export async function getInstitutionPerformance(
  state?: string,
  interventionStatus?: string,
): Promise<InstitutionPerformanceStat[]> {
  if (USE_MOCKS) return [];
  const url = buildUrl(ENDPOINTS.dashboardInstitutions, {
    state,
    intervention_status: interventionStatus,
  });
  const result = await getStandard<RawInstitutionPerformanceStat[]>(url);
  return (unwrap(result).data ?? []).map(adaptInstitutionPerformanceStat);
}

// ─── SLA Radar ────────────────────────────────────────────────────────────────

export async function getSlaRadar(bureauId?: string): Promise<SlaRadarSummary> {
  const effectiveBureau =
    _mockRole === "OFFICER" ? _mockBureauId : bureauId === "ALL" ? undefined : bureauId;
  if (USE_MOCKS) return mockGetSlaRadar(_mockRole, effectiveBureau);
  const url = buildUrl(ENDPOINTS.slaRadar, { bureau_id: effectiveBureau });
  const result = await getStandard<RawSlaRadarSummary>(url);
  return adaptSlaRadar(unwrap(result).data!);
}

// ─── Smart Triage & Explainable AI ────────────────────────────────────────────

export async function runTriage(
  text: string,
  category?: string,
  institutionAicteId?: string,
): Promise<TriageResult> {
  if (USE_MOCKS) return mockRunTriage(text);
  const result = await post<{
    recommended_bureau_code: string;
    recommended_bureau_name: string;
    recommended_category: string;
    recommended_priority: string;
    confidence_score: number;
    explanation: string;
    rationales?: { category: string; title: string; explanation: string; weight: number; matched_tokens: string[] }[];
  }>(ENDPOINTS.aiTriageSuggest, {
    subject: text.slice(0, 80),
    description: text,
    current_category: category,
    institution_aicte_id: institutionAicteId,
  });
  const raw = unwrap(result).data!;
  const allTokens = raw.rationales?.flatMap((r) => r.matched_tokens) ?? [];
  const uniqueTokens = Array.from(new Set(allTokens.filter(Boolean)));
  const perTokenWeight = uniqueTokens.length > 0 ? 1.0 / uniqueTokens.length : 1.0;

  return {
    recommended_bureau_code: raw.recommended_bureau_code as BureauCode,
    recommended_bureau_name: raw.recommended_bureau_name ?? raw.recommended_bureau_code,
    recommended_category: raw.recommended_category,
    recommended_priority: raw.recommended_priority as CasePriority,
    confidence: raw.confidence_score,
    rationale: raw.explanation ?? raw.rationales?.[0]?.explanation ?? "AI domain policy and zero-shot semantic embedding classification",
    matched_keywords: uniqueTokens.map((token) => ({
      keyword: token,
      weight: parseFloat(perTokenWeight.toFixed(3)),
      resulting_route: raw.recommended_bureau_code,
    })),
  };
}

export async function getCaseTriage(caseRef: string) {
  const result = await getStandard<{
    recommended_bureau_id: string;
    recommended_bureau_code: string;
    recommended_bureau_name: string;
    recommended_category: string;
    recommended_priority: string;
    confidence_score: number;
    explanation: string;
    rationales: { category: string; title: string; explanation: string; weight: number; matched_tokens: string[] }[];
  }>(ENDPOINTS.aiTriageSuggestCase(caseRef));
  return unwrap(result).data!;
}

export async function checkDuplicates(query: {
  subject: string;
  description: string;
  institution_aicte_id?: string | undefined;
  institution_name?: string | undefined;
  threshold?: number | undefined;
}): Promise<DuplicateMatch[]> {
  if (USE_MOCKS) return mockCheckDuplicates(query as any);
  const result = await post<{ matches: DuplicateMatch[] }>(ENDPOINTS.aiDuplicatesCheck, {
    subject: query.subject,
    description: query.description,
    institution_aicte_id: query.institution_aicte_id,
    threshold: query.threshold ?? 0.7,
  });
  return unwrap(result).data?.matches ?? [];
}

export async function getCaseDuplicates(caseRef: string, threshold = 0.7): Promise<DuplicateMatch[]> {
  const result = await getStandard<{ matches: DuplicateMatch[] }>(
    ENDPOINTS.aiDuplicatesCase(caseRef, threshold),
  );
  return unwrap(result).data?.matches ?? [];
}

export async function applyTriage(
  caseRef: string,
  result: TriageResult,
): Promise<any> {
  if (USE_MOCKS) return mockApplyTriage(caseRef, result, _mockRole);
  const res = await post<{
    case_reference_id: string;
    bureau_code: string;
    bureau_name: string;
    category: string;
    priority: string;
    status: string;
    audit_event_id: string;
    applied_at: string;
  }>(ENDPOINTS.aiTriageApply, {
    case_reference_id: caseRef,
    bureau_code: result.recommended_bureau_code,
    target_bureau_code: result.recommended_bureau_code,
    category: result.recommended_category,
    target_category: result.recommended_category,
    priority: result.recommended_priority,
    target_priority: result.recommended_priority,
    justification: "Approved AI triage recommendation from Smart Triage Workbench",
    officer_rationale: "Approved AI triage recommendation from Smart Triage Workbench",
  });
  return unwrap(res).data!;
}

// ─── Master Tickets & Smart Duplicate Grouping ────────────────────────────────

export async function autoDetectMasterTickets(params: {
  institution_aicte_id?: string;
  category?: string;
  similarity_threshold?: number;
  min_group_size?: number;
}): Promise<{ total_cases_evaluated: number; groups_detected: number; groups: DetectedGroup[] }> {
  if (USE_MOCKS) {
    return {
      total_cases_evaluated: 58,
      groups_detected: 2,
      groups: [
        {
          anchor_case_reference_id: "AICTE-2026-00008",
          anchor_subject: "Exorbitant unapproved hostel air conditioning surcharges",
          institution_name: "Apex Institute of Engineering & Technology",
          institution_aicte_id: "1-10992381",
          bureau_code: "FIN",
          bureau_name: "Finance & Fee Regulatory Bureau",
          category: "Hostel Fee Overcharge",
          member_count: 5,
          avg_similarity: 0.88,
          member_case_refs: ["AICTE-2026-00008", "AICTE-2026-00012", "AICTE-2026-00019"],
          common_keywords: ["hostel", "air conditioning", "electricity surcharge", "mandatory fee"],
        },
      ],
    };
  }
  const result = await post<RawAutoDetectResponse>(ENDPOINTS.masterTicketDetect, params);
  const data = unwrap(result).data!;
  return {
    total_cases_evaluated: data.total_cases_evaluated,
    groups_detected: data.groups_detected,
    groups: (data.groups ?? []).map(adaptDetectedGroup),
  };
}

export async function createMasterTicket(payload: {
  institution_aicte_id: string;
  category: string;
  child_case_references: string[];
  consolidated_subject?: string;
  consolidated_description?: string;
}): Promise<MasterTicket> {
  const result = await post<RawMasterTicketRead>(ENDPOINTS.masterTicketCreate, payload);
  return adaptMasterTicket(unwrap(result).data!);
}

export async function listMasterTickets(status?: string): Promise<MasterTicket[]> {
  if (USE_MOCKS) {
    return [
      {
        id: "mt-01",
        ticket_reference_id: "MT-AICTE-FIN-001",
        institution_id: "inst-01",
        institution_name: "Apex Institute of Engineering & Technology",
        institution_aicte_id: "1-10992381",
        bureau_id: "bur-fin",
        bureau_code: "FIN",
        bureau_name: "Finance Bureau",
        consolidated_subject: "Mass Complaint Cluster: Mandatory AC and Caution Deposit Extortion",
        consolidated_description: "5 students reported identical unauthorized charges in hostel fees.",
        category: "Fee Extortion",
        child_count: 5,
        similarity_threshold: 0.78,
        avg_similarity_score: 0.89,
        status: "OPEN",
        time_saved_hours: 14.5,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
        children: [],
      },
    ];
  }
  const url = buildUrl(ENDPOINTS.masterTickets, { status });
  const result = await getStandard<RawMasterTicketSummary[]>(url);
  return adaptMasterTickets(unwrap(result).data ?? []);
}

export async function getMasterTicket(ticketRef: string): Promise<MasterTicket> {
  const result = await getStandard<RawMasterTicketRead>(ENDPOINTS.masterTicketDetail(ticketRef));
  return adaptMasterTicket(unwrap(result).data!);
}

export async function resolveMasterTicket(
  ticketRef: string,
  resolutionRemarks: string,
): Promise<MasterTicket> {
  const result = await post<RawMasterTicketRead>(ENDPOINTS.masterTicketResolve(ticketRef), {
    resolution_remarks: resolutionRemarks,
  });
  return adaptMasterTicket(unwrap(result).data!);
}

export async function getMasterTicketStats(): Promise<MasterTicketStats> {
  if (USE_MOCKS) {
    return {
      total_master_tickets: 3,
      active_clusters: 2,
      resolved_clusters: 1,
      total_cases_grouped: 14,
      estimated_hours_saved: 42.5,
      top_affected_institutions: [
        { institution_name: "Apex Institute of Engineering & Technology", cluster_count: 2 },
      ],
    };
  }
  const result = await getStandard<RawMasterTicketStats>(ENDPOINTS.masterTicketStats);
  return adaptMasterTicketStats(unwrap(result).data!);
}

export async function getMasterTicketInstitutionBreakdown() {
  const result = await getStandard<any[]>(ENDPOINTS.masterTicketInstitutions);
  return unwrap(result).data ?? [];
}

// ─── Institution Trust Scores ─────────────────────────────────────────────────

export async function listInstitutionsAll(): Promise<{ id: string; name: string; aicte_permanent_id: string; state: string; district: string }[]> {
  const result = await getStandard<any[]>(ENDPOINTS.institutionsAll);
  return unwrap(result).data ?? [];
}

export async function getTrustScores(params: {
  state?: string | undefined;
  risk_tier?: string | undefined;
  min_score?: number | undefined;
  max_score?: number | undefined;
} = {}): Promise<InstitutionTrustScore[]> {
  if (USE_MOCKS) {
    return [
      {
        institution_id: "inst-01",
        aicte_permanent_id: "1-10992381",
        name: "Apex Institute of Engineering & Technology",
        state: "Rajasthan",
        district: "Kota",
        institution_type: "Private Engineering College",
        trust_score: 385,
        base_score: 1000,
        trust_grade: "B",
        risk_level: "HIGH",
        risk_tier: "Tier 5 (High Risk)",
        trend: "deteriorating",
        total_cases: 18,
        open_cases: 11,
        resolved_cases: 7,
        overdue_cases: 5,
        resolution_rate_pct: 38.8,
        top_recurring_categories: [{ category: "Fee Extortion", count: 8 }],
        deduction_breakdown: {
          sla_breaches_count: 5,
          sla_breach_points: 225,
          approaching_warnings_count: 2,
          approaching_warning_points: 30,
          severe_complaints_count: 3,
          severe_complaint_points: 150,
          sensitive_category_count: 2,
          sensitive_category_points: 70,
          master_ticket_clusters_count: 1,
          master_ticket_points: 60,
          backlog_dwell_count: 4,
          backlog_dwell_points: 80,
          recovery_bonus_points: 0,
          total_deductions: 615,
        },
        citations: [
          {
            case_reference_id: "AICTE-2026-00008",
            subject: "Hostel Fee Surcharges",
            category: "Fee Extortion",
            priority: "URGENT",
            status: "In Progress",
            points_deducted: 50,
            deduction_reason: "Urgent severity statutory violation",
            created_at: new Date().toISOString(),
          },
        ],
        automated_directive: "Automated Show-Cause Notice issued to Governing Board & College Registrar",
        recommended_action_code: "SHOW_CAUSE_SUMMONS",
        last_audit_date: new Date().toISOString(),
      },
    ];
  }
  const url = buildUrl(ENDPOINTS.institutionsTrustScores, params);
  const result = await getStandard<RawInstitutionTrustScoreDetail[]>(url);
  return (unwrap(result).data ?? []).map(adaptTrustScoreDetail);
}

export async function getTrustSummary(): Promise<TrustLeaderboardSummary> {
  if (USE_MOCKS) {
    return {
      national_average_score: 742.6,
      total_institutions: 15,
      critical_risk_count: 1,
      high_risk_count: 2,
      watchlist_count: 3,
      compliant_count: 9,
    };
  }
  const result = await getStandard<RawTrustLeaderboardSummary>(ENDPOINTS.institutionsTrustSummary);
  return adaptTrustLeaderboardSummary(unwrap(result).data!);
}

export async function getInstitutionTrustDetail(institutionId: string): Promise<InstitutionTrustScore> {
  const result = await getStandard<RawInstitutionTrustScoreDetail>(
    ENDPOINTS.institutionTrustScoreDetail(institutionId),
  );
  return adaptTrustScoreDetail(unwrap(result).data!);
}

export async function dispatchRegulatoryAction(
  institutionId: string,
  actionData: { action_code: string; summary?: string },
): Promise<RegulatoryActionResponse> {
  const payload = {
    action_code: actionData.action_code,
    action_type: actionData.action_code,
    summary: actionData.summary,
    directive_notes: actionData.summary,
  };
  const result = await post<RawRegulatoryActionResponse>(
    ENDPOINTS.institutionAction(institutionId),
    payload,
  );
  return adaptRegulatoryAction(unwrap(result).data!);
}

// ─── Telegram Bot Status Tracker ──────────────────────────────────────────────

export async function getTelegramBotInfo(): Promise<TelegramBotInfo> {
  if (USE_MOCKS) {
    return {
      bot_name: "AICTE Grievance Status Tracker Bot",
      bot_username: "@aictesih_bot",
      is_configured: true,
      webhook_url_example: "/api/v1/telegram/webhook",
      commands: [
        {"command": "/start", "description": "Welcome message and usage instructions"},
        {"command": "/status <ref_id>", "description": "Direct case status query command"},
        {"command": "/help", "description": "Help instructions"},
      ],
      supported_formats: ["AICTE-2026-XXXXX", "MT-XXXX"],
    };
  }
  const result = await getStandard<RawTelegramBotInfo>(ENDPOINTS.telegramInfo);
  return adaptTelegramBotInfo(unwrap(result).data!);
}

export async function simulateTelegramChat(
  message: string,
  firstName = "Student",
  chatId = 99999999,
): Promise<TelegramSimulateResponse> {
  if (USE_MOCKS) {
    return {
      message_sent: message,
      reply_html: `<b>AICTE Grievance Redressal Status</b>\n\nCase Ref: <code>${message}</code>\nStatus: <b>Under Triage</b>\nAssigned Bureau: <b>Student Welfare</b>\n\n<i>PII Redacted under Data Governance Policy.</i>`,
      extracted_case_ref: message.toUpperCase(),
      chat_id: chatId,
      parse_mode: "HTML",
    };
  }
  const result = await post<RawTelegramSimulateResponse>(ENDPOINTS.telegramSimulate, {
    message,
    first_name: firstName,
    chat_id: chatId,
  });
  return adaptTelegramSimulateResponse(unwrap(result).data!);
}

// ─── Magic Zero-Shot AI Ingestion & Multilingual ──────────────────────────────

export async function magicAnalyze(grievanceText: string): Promise<MagicAnalysisResult> {
  if (USE_MOCKS) {
    return {
      extracted_college: {
        name: "Apex Institute of Engineering & Technology",
        id: "inst-01",
        aicte_permanent_id: "1-10992381",
        state: "Rajasthan",
        district: "Kota",
        confidence: 0.94,
        is_database_match: true,
        matched_phrase: "Apex Institute",
      },
      categorization: {
        category: "Hostel Fee Overcharge",
        confidence: 0.91,
        detected_signals: ["hostel fees", "unauthorized charges"],
      },
      priority_assignment: {
        priority: "HIGH",
        urgency_signals: ["financial duress"],
        sla_hours: 48,
        rationale: "Unlawful fee collection detected with high recurrence.",
      },
      bureau_routing: {
        bureau_id: "bur-fin",
        bureau_code: "FIN",
        bureau_name: "Finance Bureau",
        confidence: 0.96,
        routing_rationale: "Statutory jurisdiction under Fee Regulatory Committee.",
        all_scores: { FIN: 0.96, STU: 0.32, APPR: 0.12, FDC: 0.05 },
        key_evidence_tokens: ["fee", "deposit", "caution", "surcharge"],
      },
      generated_subject: "Exorbitant unapproved hostel surcharge and fee dispute",
      summary_insight: "Complainant reports non-refundable caution deposit deduction.",
      translation: {
        source_language: "hi",
        source_language_name: "Hindi",
        is_translated: true,
        original_text: grievanceText,
        translated_text: "Hostel management has charged unapproved security fee.",
        confidence: 0.98,
        provider: "BHASHINI_NMT_ULCA",
      },
    };
  }
  const result = await post<RawMagicAnalysisResult>(ENDPOINTS.magicAnalyze, {
    grievance_text: grievanceText,
  });
  return adaptMagicAnalysisResult(unwrap(result).data!);
}

export async function magicIngest(payload: {
  grievance_text: string;
  student_name?: string | undefined;
  student_email?: string | undefined;
  student_phone?: string | undefined;
  institution_id?: string | undefined;
  auto_docket?: boolean | undefined;
}): Promise<MagicIngestResponse> {
  const result = await post<RawMagicIngestResponse>(ENDPOINTS.magicIngest, payload);
  return adaptMagicIngestResponse(unwrap(result).data!);
}

// ─── CSV Ingestion ────────────────────────────────────────────────────────────

export async function previewCsv(csvContent: string): Promise<CsvPreviewResult> {
  if (USE_MOCKS) return mockPreviewCsv(csvContent);

  const formData = new FormData();
  const blob = new Blob([csvContent], { type: "text/csv" });
  formData.append("file", blob, "upload.csv");

  const result = await postForm<RawCsvPreviewResponse>(ENDPOINTS.csvPreview, formData);
  return adaptCsvPreview(unwrap(result).data!);
}

export async function commitCsv(rows: CsvRowResult[]): Promise<CsvCommitResult> {
  if (USE_MOCKS) return mockCommitCsv(rows, _mockRole);
  const result = await post<RawCsvCommitResponse>(ENDPOINTS.csvCommit, {
    rows,
    skip_invalid: true,
  });
  return adaptCsvCommit(unwrap(result).data!);
}
