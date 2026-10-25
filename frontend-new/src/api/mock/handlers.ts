/**
 * Mock API handlers — implement all API functions using the in-memory store.
 * All mutations are durable within the session (no page reload needed).
 * Simulates 300–600ms network latency.
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
  SlaRadarItem,
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
  BureauCode,
  CasePriority,
  CaseStatus,
  ApiError,
  StudentPortalData,
  StudentAuthProfile,
  StudentGrievanceCase,
  StudentCaseAttachment,
  StudentUploadResult,
} from "@/types/ui";
import {
  getCases,
  getCaseByRef,
  updateCase,
  getTimeline,
  addTimelineEvent,
  getNotes,
  addNote,
  getHistory,
  addHistory,
  appendCase,
  MOCK_BUREAUS,
  MOCK_OFFICERS,
  BUREAU_OFFICERS,
} from "./store";
import { canTransition, isActive } from "@/lib/stateMachine";
import { runTriageRule, checkDuplicatesRule } from "@/lib/triage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const latency = () =>
  new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 300));

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function apiErr(code: string, message: string, status = 422): never {
  const err: ApiError = { code, message, status };
  throw err;
}

function slaStatus(c: ComplaintCase): "OVERDUE" | "APPROACHING" | "ON_TRACK" {
  if (!isActive(c.status) || !c.due_date) return "ON_TRACK";
  const now = Date.now();
  const due = new Date(c.due_date).getTime();
  const hoursLeft = (due - now) / 3600000;
  if (hoursLeft < 0) return "OVERDUE";
  if (hoursLeft < 48) return "APPROACHING";
  return "ON_TRACK";
}

// ─── Demo users ───────────────────────────────────────────────────────────────

const DEMO_USERS: Record<string, CurrentUser> = {
  ADMIN: {
    id: "user-admin",
    email: "admin@aicte-demo.gov.in",
    full_name: "Smt. Sunita Sharma",
    role: "ADMIN",
    bureau_id: null,
    bureau_name: null,
    bureau_code: null,
    permissions: ["cases:read:all", "cases:create", "cases:update:status", "cases:assign",
      "cases:notes:create", "cases:notes:read:confidential", "cases:export", "cases:import",
      "dashboard:read:all", "settings:manage", "audit:read:all"],
  },
  SUPERVISOR: {
    id: "user-supervisor",
    email: "supervisor@aicte-demo.gov.in",
    full_name: "Dr. Ramesh Chandra",
    role: "SUPERVISOR",
    bureau_id: null,
    bureau_name: null,
    bureau_code: null,
    permissions: ["cases:read:all", "cases:assign", "cases:notes:create",
      "cases:notes:read:confidential", "cases:export", "dashboard:read:all", "audit:read:all"],
  },
  OFFICER: {
    id: "officer-appr-1",
    email: "officer.appr@aicte-demo.gov.in",
    full_name: "Shri Arvind Verma",
    role: "OFFICER",
    bureau_id: "bureau-appr",
    bureau_name: "Approval Bureau",
    bureau_code: "APPR",
    permissions: ["cases:read:bureau", "cases:update:status", "cases:notes:create",
      "cases:notes:read:confidential", "dashboard:read:bureau", "audit:read:bureau"],
  },
  AUDITOR: {
    id: "user-auditor",
    email: "auditor@aicte-demo.gov.in",
    full_name: "CA Ananya Iyer",
    role: "AUDITOR",
    bureau_id: null,
    bureau_name: null,
    bureau_code: null,
    permissions: ["cases:read:all:redacted", "cases:export:redacted", "dashboard:read:all", "audit:read:all"],
  },
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function mockSwitchRole(role: string, bureauId?: string): Promise<CurrentUser> {
  await latency();
  let baseRole = role.toUpperCase();
  let targetBureauCode = bureauId;
  if (baseRole.startsWith("OFFICER_")) {
    targetBureauCode = baseRole.replace("OFFICER_", "");
    baseRole = "OFFICER";
  }
  const user = DEMO_USERS[baseRole];
  if (!user) apiErr("INVALID_ROLE", `Invalid role: ${role}. Valid: ADMIN, SUPERVISOR, OFFICER, AUDITOR`, 400);
  if (targetBureauCode && user) {
    const bur = MOCK_BUREAUS.find((b) => b.id === targetBureauCode || b.code === targetBureauCode);
    return {
      ...user,
      bureau_id: bur?.id ?? targetBureauCode,
      bureau_code: bur?.code ?? targetBureauCode,
      bureau_name: bur?.name ?? user.bureau_name,
    };
  }
  return user;
}

export async function mockGetMe(role: string): Promise<CurrentUser> {
  await latency();
  return DEMO_USERS[role.toUpperCase()] ?? DEMO_USERS["SUPERVISOR"]!;
}

// ─── Bureaus ──────────────────────────────────────────────────────────────────

export async function mockListBureaus(): Promise<Bureau[]> {
  await latency();
  return MOCK_BUREAUS;
}

export async function mockListOfficers(bureauId: string): Promise<Officer[]> {
  await latency();
  return BUREAU_OFFICERS[bureauId] ?? [];
}

// ─── Cases ────────────────────────────────────────────────────────────────────

export async function mockListCases(
  params: ListCasesParams,
  currentRole: string,
  currentBureauId?: string | null,
): Promise<ListCasesResponse> {
  await latency();

  let cases = getCases();

  // Role-based scoping: OFFICER sees only own bureau
  if (currentRole === "OFFICER" && currentBureauId) {
    cases = cases.filter((c) => c.bureau_id === currentBureauId);
  }

  // AUDITOR: strip confidential field
  if (currentRole === "AUDITOR") {
    cases = cases.map((c) => ({ ...c, description_confidential: undefined }));
  }

  // Filters
  if (params.bureau_id) cases = cases.filter((c) => c.bureau_id === params.bureau_id);
  if (params.status) cases = cases.filter((c) => c.status === params.status);
  if (params.priority) cases = cases.filter((c) => c.priority === params.priority);
  if (params.search) {
    const q = params.search.toLowerCase();
    cases = cases.filter(
      (c) =>
        c.case_reference_id.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.institution_name.toLowerCase().includes(q),
    );
  }

  // Sorting
  const sortBy = params.sort_by ?? "created_at";
  const sortDir = params.sort_dir ?? "desc";
  cases = [...cases].sort((a, b) => {
    let av: string | number = a[sortBy as keyof ComplaintCase] as string | number ?? "";
    let bv: string | number = b[sortBy as keyof ComplaintCase] as string | number ?? "";
    if (sortBy === "priority") {
      const order = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 };
      av = order[a.priority] ?? 0;
      bv = order[b.priority] ?? 0;
    }
    return sortDir === "desc" ? (av > bv ? -1 : 1) : (av < bv ? -1 : 1);
  });

  const total = cases.length;
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  const start = (page - 1) * pageSize;
  const items = cases.slice(start, start + pageSize);

  return { items, total, page, page_size: pageSize, total_pages: Math.ceil(total / pageSize) || 1 };
}

export async function mockGetCase(
  caseRef: string,
  currentRole: string,
): Promise<ComplaintCase> {
  await latency();
  const c = getCaseByRef(caseRef);
  if (!c) apiErr("NOT_FOUND", `Case ${caseRef} not found.`, 404);
  if (currentRole === "AUDITOR") return { ...c, description_confidential: undefined };
  return c;
}

// ─── Transitions ──────────────────────────────────────────────────────────────

export async function mockTransitionCase(
  params: TransitionCaseParams,
  currentRole: string,
  currentBureauId?: string | null,
): Promise<ComplaintCase> {
  await latency();

  const c = getCaseByRef(params.case_ref);
  if (!c) apiErr("NOT_FOUND", `Case ${params.case_ref} not found.`, 404);

  // Role check: AUDITOR cannot transition
  if (currentRole === "AUDITOR") {
    apiErr("INSUFFICIENT_ROLE_PERMISSIONS", "AUDITOR role cannot change case status.", 403);
  }
  // OFFICER can only modify own bureau
  if (currentRole === "OFFICER" && currentBureauId && c.bureau_id !== currentBureauId) {
    apiErr("INSUFFICIENT_BUREAU_PERMISSIONS", "Case belongs to another bureau.", 403);
  }

  if (c.status === "Closed") {
    apiErr("CASE_IS_CLOSED", `Case ${params.case_ref} is Closed and cannot transition.`);
  }

  if (!canTransition(c.status, params.to_status)) {
    apiErr(
      "INVALID_STATE_TRANSITION",
      `Cannot transition from '${c.status}' to '${params.to_status}'.`,
    );
  }

  if (!params.remarks || params.remarks.trim().length < 3) {
    apiErr("MISSING_REMARKS", "Remarks are required (min 3 characters).");
  }

  const now = new Date().toISOString();
  const prev = c.status;

  const patch: Partial<ComplaintCase> = {
    status: params.to_status,
    updated_at: now,
  };
  if (params.to_status === "Resolved") {
    patch.resolved_at = now;
    patch.closure_remarks = params.remarks;
  }
  if (params.to_status === "Closed") {
    patch.closed_at = now;
  }
  if (params.to_status === "In Progress" && c.status === "Resolved") {
    patch.resolved_at = null; // reopen
  }

  const updated = updateCase(params.case_ref, patch);

  addTimelineEvent(params.case_ref, {
    id: makeId("tl"),
    case_id: c.id,
    actor_id: "current-user",
    actor_role: currentRole,
    actor_name: null,
    event_type: params.to_status === "Resolved" ? "RESOLVED" : params.to_status === "Closed" ? "CLOSED" : "STATUS_CHANGE",
    previous_state: prev as CaseStatus,
    new_state: params.to_status,
    remark: params.remarks,
    metadata: { remarks: params.remarks, action: "execute_transition" },
    timestamp: now,
  });

  return updated;
}

// ─── Reassign ─────────────────────────────────────────────────────────────────

export async function mockAssignCase(
  params: AssignCaseParams,
  currentRole: string,
): Promise<ComplaintCase> {
  await latency();

  if (!["ADMIN", "SUPERVISOR"].includes(currentRole)) {
    apiErr("INSUFFICIENT_ROLE_PERMISSIONS", "Only ADMIN or SUPERVISOR can assign cases.", 403);
  }

  const c = getCaseByRef(params.case_ref);
  if (!c) apiErr("NOT_FOUND", `Case ${params.case_ref} not found.`, 404);

  const bureau = MOCK_BUREAUS.find((b) => b.id === params.to_bureau_id);
  if (!bureau) apiErr("INVALID_BUREAU", `Bureau ${params.to_bureau_id} not found.`, 404);

  const officerList = BUREAU_OFFICERS[params.to_bureau_id] ?? [];
  const officer = params.to_officer_id
    ? officerList.find((o) => o.id === params.to_officer_id)
    : officerList[0];

  const now = new Date().toISOString();
  const fromBureauName = c.bureau_name;

  const updated = updateCase(params.case_ref, {
    bureau_id: params.to_bureau_id,
    bureau_code: bureau.code as BureauCode,
    bureau_name: bureau.name,
    assigned_officer_id: officer?.id,
    assigned_officer_name: officer?.full_name,
    updated_at: now,
  });

  addTimelineEvent(params.case_ref, {
    id: makeId("tl"),
    case_id: c.id,
    actor_id: "current-user",
    actor_role: currentRole,
    actor_name: null,
    event_type: "REASSIGNED",
    previous_state: c.status,
    new_state: c.status,
    remark: params.reason,
    metadata: { transfer_reason: params.reason, from_bureau: fromBureauName, to_bureau: bureau.name },
    timestamp: now,
  });

  addHistory(params.case_ref, {
    id: makeId("hist"),
    case_id: c.id,
    from_bureau_id: c.bureau_id,
    from_bureau_name: fromBureauName,
    to_bureau_id: params.to_bureau_id,
    to_bureau_name: bureau.name,
    assigned_by_id: "current-user",
    assigned_by_name: null,
    transfer_reason: params.reason,
    created_at: now,
  });

  return updated;
}

// ─── Escalate ─────────────────────────────────────────────────────────────────

export async function mockEscalateCase(
  params: EscalateParams,
  currentRole: string,
): Promise<ComplaintCase> {
  await latency();

  const c = getCaseByRef(params.case_ref);
  if (!c) apiErr("NOT_FOUND", `Case ${params.case_ref} not found.`, 404);

  if (currentRole !== "ADMIN" && currentRole !== "SUPERVISOR") {
    apiErr("INSUFFICIENT_ROLE_PERMISSIONS", `${currentRole} cannot escalate cases. Escalations are restricted to ADMIN and SUPERVISOR.`, 403);
  }

  const newLevel = Math.min(c.escalation_level + 1, 2);
  const now = new Date().toISOString();

  const updated = updateCase(params.case_ref, {
    escalation_level: newLevel,
    updated_at: now,
  });

  addTimelineEvent(params.case_ref, {
    id: makeId("tl"),
    case_id: c.id,
    actor_id: "current-user",
    actor_role: currentRole,
    actor_name: null,
    event_type: "ESCALATED",
    previous_state: c.status,
    new_state: c.status,
    remark: params.reason,
    metadata: { reason: params.reason, level: newLevel },
    timestamp: now,
  });

  return updated;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function mockAddNote(
  params: AddNoteParams,
  currentRole: string,
): Promise<Note> {
  await latency();

  if (currentRole === "AUDITOR") {
    apiErr("INSUFFICIENT_ROLE_PERMISSIONS", "AUDITOR cannot add notes.", 403);
  }

  const c = getCaseByRef(params.case_ref);
  if (!c) apiErr("NOT_FOUND", `Case ${params.case_ref} not found.`, 404);

  const now = new Date().toISOString();
  const note: Note = {
    id: makeId("note"),
    case_id: c.id,
    author_id: "current-user",
    author_name: null,
    author_role: currentRole,
    content: params.content,
    is_confidential: params.is_confidential,
    created_at: now,
  };

  addNote(params.case_ref, note);

  addTimelineEvent(params.case_ref, {
    id: makeId("tl"),
    case_id: c.id,
    actor_id: "current-user",
    actor_role: currentRole,
    actor_name: null,
    event_type: "NOTE_ADDED",
    previous_state: c.status,
    new_state: c.status,
    remark: params.is_confidential ? "[Confidential note added]" : "Note added.",
    metadata: { note_id: note.id, is_confidential: params.is_confidential },
    timestamp: now,
  });

  return note;
}

export async function mockGetNotes(
  caseRef: string,
  currentRole: string,
): Promise<Note[]> {
  await latency();
  const notes = getNotes(caseRef);
  // AUDITOR must not see content of confidential notes (backend gap — guarded in frontend)
  if (currentRole === "AUDITOR") {
    return notes.map((n) =>
      n.is_confidential ? { ...n, content: "[Confidential — not visible to Auditor]" } : n,
    );
  }
  return notes;
}

export async function mockGetTimeline(caseRef: string): Promise<TimelineEntry[]> {
  await latency();
  return getTimeline(caseRef);
}

export async function mockGetAssignmentHistory(
  caseRef: string,
): Promise<AssignmentHistoryEntry[]> {
  await latency();
  return getHistory(caseRef);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function mockGetDashboardStats(
  currentRole: string,
  bureauId?: string | null,
): Promise<DashboardStats> {
  await latency();

  const allMockCases = getCases();
  let cases = allMockCases;
  if (currentRole === "OFFICER" && bureauId) {
    cases = cases.filter((c) => c.bureau_id === bureauId);
  }

  const total = cases.length;
  const resolved = cases.filter((c) => c.status === "Resolved").length;
  const closed = cases.filter((c) => c.status === "Closed").length;
  const active = total - resolved - closed;
  const overdue = cases.filter((c) => slaStatus(c) === "OVERDUE").length;
  const approaching = cases.filter((c) => slaStatus(c) === "APPROACHING").length;
  const onTrack = cases.filter((c) => slaStatus(c) === "ON_TRACK" && isActive(c.status)).length;

  const bureauBreakdown = MOCK_BUREAUS.map((b) => {
    const bc = allMockCases.filter((c) => c.bureau_id === b.id);
    return {
      bureau_id: b.id,
      bureau_code: b.code,
      bureau_name: b.name,
      total: bc.length,
      active: bc.filter((c) => isActive(c.status)).length,
      overdue: bc.filter((c) => slaStatus(c) === "OVERDUE").length,
      resolved: bc.filter((c) => c.status === "Resolved" || c.status === "Closed").length,
    };
  });

  const statusCounts: Partial<Record<CaseStatus, number>> = {};
  for (const c of cases) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  }

  const priorityCounts: Partial<Record<CasePriority, number>> = {};
  for (const c of cases) {
    priorityCounts[c.priority] = (priorityCounts[c.priority] ?? 0) + 1;
  }

  return {
    total_cases: total,
    active_cases: active,
    resolved_cases: resolved,
    closed_cases: closed,
    overdue_cases: overdue,
    approaching_cases: approaching,
    on_track_cases: onTrack,
    resolution_rate: total > 0 ? (resolved + closed) / total : 0,
    bureau_breakdown: bureauBreakdown,
    status_breakdown: Object.entries(statusCounts).map(([status, count]) => ({
      status: status as CaseStatus,
      count: count ?? 0,
    })),
    priority_breakdown: Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority as CasePriority,
      count: count ?? 0,
    })),
  };
}

// ─── SLA Radar ────────────────────────────────────────────────────────────────

export async function mockGetSlaRadar(
  currentRole: string,
  bureauId?: string | null,
): Promise<SlaRadarSummary> {
  await latency();

  let cases = getCases();
  if (currentRole === "OFFICER" && bureauId) {
    cases = cases.filter((c) => c.bureau_id === bureauId || c.bureau_code === bureauId);
  } else if (bureauId && bureauId !== "ALL") {
    cases = cases.filter((c) => c.bureau_id === bureauId || c.bureau_code === bureauId);
  }

  const active = cases.filter((c) => isActive(c.status));
  const completed = cases.filter((c) => !isActive(c.status));
  const now = Date.now();

  function toItem(c: ComplaintCase): SlaRadarItem {
    const due = c.due_date ? new Date(c.due_date).getTime() : null;
    const hoursLeft = due !== null ? (due - now) / 3600000 : null;
    const sl = slaStatus(c);
    return {
      case_reference_id: c.case_reference_id,
      subject: c.subject,
      category: c.category,
      priority: c.priority,
      status: c.status,
      bureau_code: c.bureau_code,
      bureau_name: c.bureau_name,
      institution_name: c.institution_name,
      due_date: c.due_date,
      escalation_level: c.escalation_level,
      sla_status: sl,
      hours_remaining: hoursLeft !== null ? parseFloat(hoursLeft.toFixed(1)) : null,
      is_overdue: sl === "OVERDUE",
    };
  }

  const overdueItems = active.filter((c) => slaStatus(c) === "OVERDUE").map(toItem);
  const approachingItems = active.filter((c) => slaStatus(c) === "APPROACHING").map(toItem);
  const onTrack = active.filter((c) => slaStatus(c) === "ON_TRACK").length;

  overdueItems.sort((a, b) => (a.hours_remaining ?? 0) - (b.hours_remaining ?? 0));
  approachingItems.sort((a, b) => (a.hours_remaining ?? 9999) - (b.hours_remaining ?? 9999));

  return {
    total_active_cases: active.length,
    overdue_count: overdueItems.length,
    approaching_count: approachingItems.length,
    on_track_count: onTrack,
    completed_count: completed.length,
    overdue_cases: overdueItems,
    approaching_cases: approachingItems,
  };
}

// ─── Smart Triage ─────────────────────────────────────────────────────────────

export async function mockRunTriage(
  text: string,
): Promise<TriageResult> {
  await latency();
  return runTriageRule(text);
}

export async function mockCheckDuplicates(query: {
  subject: string;
  description: string;
  institution_name?: string;
}): Promise<DuplicateMatch[]> {
  await latency();
  return checkDuplicatesRule(query, getCases());
}

export async function mockApplyTriage(
  caseRef: string,
  result: TriageResult,
  currentRole: string,
): Promise<ComplaintCase> {
  await latency();

  const c = getCaseByRef(caseRef);
  if (!c) apiErr("NOT_FOUND", `Case ${caseRef} not found.`, 404);
  if (!["ADMIN", "SUPERVISOR"].includes(currentRole)) {
    apiErr("INSUFFICIENT_ROLE_PERMISSIONS", "Only ADMIN or SUPERVISOR can apply triage.", 403);
  }

  const now = new Date().toISOString();
  const updated = updateCase(caseRef, {
    bureau_code: result.recommended_bureau_code,
    category: result.recommended_category,
    priority: result.recommended_priority,
    updated_at: now,
  });

  addTimelineEvent(caseRef, {
    id: makeId("tl"),
    case_id: c.id,
    actor_id: "current-user",
    actor_role: currentRole,
    actor_name: null,
    event_type: "TRIAGE_APPLIED",
    previous_state: c.status,
    new_state: c.status,
    remark: `Triage applied: recommended ${result.recommended_bureau_name} (${Math.round(result.confidence * 100)}% confidence).`,
    metadata: { action: "apply_triage", confidence: result.confidence },
    timestamp: now,
  });

  return updated;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

const VALID_BUREAU_CODES = ["APPR", "STU", "FDC", "FIN"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const AICTE_ID_PATTERN = /^\d-\d{7}$/;

const MOCK_AICTE_IDS = [
  "1-3324561", "1-4521890", "1-2893421", "2-7654321", "1-5643210",
  "1-8765432", "2-3456789", "1-6789012", "1-9876543", "2-1234567",
  "1-7654321", "1-4567890", "2-8901234", "2-2345678", "1-5678901",
];

export async function mockPreviewCsv(csvContent: string): Promise<CsvPreviewResult> {
  await latency();

  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { total_rows: 0, valid_rows: 0, invalid_rows: 0, can_commit: false, rows: [] };
  }

  const rows = lines.slice(1).map((line, idx) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    // Expected: institution_aicte_id, bureau_code, subject, category, priority, description, is_confidential
    const [aicte_id = "", bureau_code = "", subject = "", category = "", priority = "MEDIUM", description = "", is_confidential_str = "false"] = cols;

    const errors: { row_number: number; field: string; message: string }[] = [];
    const rowNum = idx + 2;

    if (!AICTE_ID_PATTERN.test(aicte_id)) {
      errors.push({ row_number: rowNum, field: "institution_aicte_id", message: `Invalid AICTE ID format '${aicte_id}'. Expected: \\d-\\d{7}` });
    } else if (!MOCK_AICTE_IDS.includes(aicte_id)) {
      errors.push({ row_number: rowNum, field: "institution_aicte_id", message: `AICTE ID '${aicte_id}' not found in institution registry.` });
    }

    if (!VALID_BUREAU_CODES.includes(bureau_code.toUpperCase())) {
      errors.push({ row_number: rowNum, field: "bureau_code", message: `Unknown bureau code '${bureau_code}'. Valid: ${VALID_BUREAU_CODES.join(", ")}` });
    }

    if (!subject.trim()) {
      errors.push({ row_number: rowNum, field: "subject", message: "Subject is required." });
    }

    const normalPriority = priority.toUpperCase();
    if (normalPriority && !VALID_PRIORITIES.includes(normalPriority)) {
      errors.push({ row_number: rowNum, field: "priority", message: `Invalid priority '${priority}'. Valid: ${VALID_PRIORITIES.join(", ")}` });
    }

    const bureau = MOCK_BUREAUS.find((b) => b.code === bureau_code.toUpperCase());
    const is_confidential = ["true", "1", "yes"].includes(is_confidential_str.toLowerCase());

    return {
      row_number: rowNum,
      is_valid: errors.length === 0,
      institution_aicte_id: aicte_id,
      institution_name: MOCK_AICTE_IDS.includes(aicte_id) ? "Known Institution" : null,
      bureau_code: bureau_code.toUpperCase(),
      bureau_name: bureau?.name ?? null,
      subject,
      category: category || "General",
      priority: normalPriority || "MEDIUM",
      is_confidential,
      description,
      errors,
      warnings: [],
      duplicate_case_ref: null,
    };
  });

  const valid = rows.filter((r) => r.is_valid).length;
  return {
    total_rows: rows.length,
    valid_rows: valid,
    invalid_rows: rows.length - valid,
    can_commit: valid > 0,
    rows,
  };
}

export async function mockCommitCsv(
  rows: CsvPreviewResult["rows"],
  currentRole: string,
): Promise<CsvCommitResult> {
  await latency();

  if (!["ADMIN"].includes(currentRole)) {
    apiErr("INSUFFICIENT_ROLE_PERMISSIONS", "Only ADMIN can import CSV cases.", 403);
  }

  const validRows = rows.filter((r) => r.is_valid);
  const refs: string[] = [];
  const existingCount = getCases().length;

  for (const [i, row] of validRows.entries()) {
    if (!row) continue;
    const bureau = MOCK_BUREAUS.find((b) => b.code === row.bureau_code);
    if (!bureau) continue;

    const refNum = existingCount + i + 1001;
    const ref = `AICTE-2026-${refNum}`;
    refs.push(ref);

    const newCase: ComplaintCase = {
      id: makeId("case"),
      case_reference_id: ref,
      institution_id: `inst-csv-${i}`,
      institution_name: row.institution_name ?? row.institution_aicte_id,
      aicte_permanent_id: row.institution_aicte_id,
      bureau_id: bureau.id,
      bureau_code: bureau.code,
      bureau_name: bureau.name,
      subject: row.subject,
      description_redacted: row.description,
      description_confidential: row.is_confidential ? row.description : undefined,
      category: row.category,
      priority: (row.priority || "MEDIUM") as CasePriority,
      status: "Received",
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      escalation_level: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      closed_at: null,
      closure_remarks: null,
    };

    appendCase(newCase);
  }

  return {
    imported_count: validRows.length,
    skipped_count: rows.length - validRows.length,
    failed_count: 0,
    created_case_references: refs,
  };
}

// ─── Student Portal & Complainant Verification ────────────────────────────────

export async function mockSendStudentOtp(target: string, _fullName?: string) {
  await latency();
  return {
    tx_ref: "TX-MOCK-STUDENT-" + Math.floor(100000 + Math.random() * 900000),
    target_masked: target.includes("@") ? target : `XXXX-XX-${target.slice(-4)}`,
    expires_in_seconds: 600,
    message: "Verification OTP successfully dispatched to your target.",
    sandbox_otp: "123456",
  };
}

export async function mockVerifyStudentOtp(
  _txRef: string,
  otpCode: string,
): Promise<StudentAuthProfile> {
  await latency();
  if (otpCode !== "123456" && otpCode.length !== 6) {
    apiErr("INVALID_OTP", "Invalid verification code entered. Try 123456.", 400);
  }
  return {
    verification_token: "MOCK_STUDENT_JWT_TOKEN",
    complainant_id: "student-aarav-sharma",
    masked_identifier: "XXXX-XX-3210",
    full_name: "Aarav Sharma",
    complainant_type: "STUDENT",
    verification_method: "MOBILE_EMAIL_2FA",
    verified_at: new Date().toISOString(),
    is_whistleblower_shielded: true,
  };
}

let studentCaseRefs: string[] | null = null;

export async function mockGetStudentPortalData(_token?: string): Promise<StudentPortalData> {
  await latency();
  const allCases = getCases();

  // Pin student cases so state transitions (e.g. Awaiting Information -> In Progress) persist across re-fetches
  if (!studentCaseRefs || studentCaseRefs.length === 0) {
    let awaitingCase = allCases.find((c) => c.status === "Awaiting Information");
    if (!awaitingCase && allCases.length > 1) {
      updateCase(allCases[1]!.case_reference_id, { status: "Awaiting Information" });
      awaitingCase = getCaseByRef(allCases[1]!.case_reference_id);
    }
    const otherCases = allCases.filter((c) => c.case_reference_id !== awaitingCase?.case_reference_id);
    const inProgressCase = otherCases.find((c) => c.status === "In Progress" || c.status === "Assigned") ?? otherCases[0];
    const resolvedCase = otherCases.find((c) => c.status === "Resolved" || c.status === "Closed") ?? otherCases[otherCases.length - 1];

    studentCaseRefs = [
      awaitingCase?.case_reference_id,
      inProgressCase?.case_reference_id,
      resolvedCase?.case_reference_id,
    ].filter(Boolean) as string[];
  }

  const studentCasesRaw = studentCaseRefs
    .map((ref) => getCaseByRef(ref))
    .filter(Boolean) as ComplaintCase[];

  const formattedCases: StudentGrievanceCase[] = studentCasesRaw.map((c) => {
    const rawTimeline = getTimeline(c.case_reference_id);
    return {
      id: c.id,
      case_reference_id: c.case_reference_id,
      subject: c.subject,
      description_redacted: c.description_redacted,
      category: c.category,
      priority: c.priority,
      status: c.status,
      institution_name: c.institution_name,
      aicte_permanent_id: c.aicte_permanent_id,
      bureau_code: c.bureau_code,
      bureau_name: c.bureau_name,
      due_date: c.due_date,
      created_at: c.created_at,
      updated_at: c.updated_at,
      resolved_at: c.resolved_at ?? null,
      closure_remarks: c.closure_remarks ?? null,
      is_awaiting_information: c.status === "Awaiting Information",
      attachments: [
        {
          id: `att-mock-${c.id}-1`,
          file_name: "initial_grievance_proof.pdf",
          file_size_bytes: 245760,
          mime_type: "application/pdf",
          secure_url: "#",
          category: "COMMUNICATION_RECORD",
          description: "Original grievance documentation submitted at intake",
          created_at: c.created_at,
        },
      ],
      timeline: rawTimeline.map((t) => ({
        timestamp: t.timestamp,
        event_type: t.event_type,
        previous_state: t.previous_state,
        new_state: t.new_state,
        remarks: t.remark,
      })),
    };
  });

  const activeCount = formattedCases.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length;
  const actionRequiredCount = formattedCases.filter((c) => c.status === "Awaiting Information").length;
  const resolvedCount = formattedCases.filter((c) => c.status === "Resolved" || c.status === "Closed").length;

  return {
    complainant: {
      verification_token: "MOCK_STUDENT_JWT_TOKEN",
      complainant_id: "student-aarav-sharma",
      masked_identifier: "XXXX-XX-3210",
      full_name: "Aarav Sharma",
      complainant_type: "STUDENT",
      verification_method: "MOBILE_EMAIL_2FA",
      verified_at: new Date().toISOString(),
      is_whistleblower_shielded: true,
    },
    cases: formattedCases,
    active_count: activeCount,
    action_required_count: actionRequiredCount,
    resolved_count: resolvedCount,
  };
}

export async function mockUploadStudentDocument(
  caseRef: string,
  file: File,
  description?: string,
): Promise<StudentUploadResult> {
  await latency();
  const c = getCaseByRef(caseRef);
  if (!c) apiErr("NOT_FOUND", `Case ${caseRef} not found.`, 404);

  let newStatus = c.status;
  if (c.status === "Awaiting Information") {
    newStatus = "In Progress";
    updateCase(caseRef, { status: "In Progress" });
    addTimelineEvent(caseRef, {
      id: makeId("tl"),
      case_id: c.id,
      actor_id: null,
      actor_role: "COMPLAINANT",
      actor_name: "Aarav Sharma (Verified Student)",
      event_type: "STATUS_CHANGE",
      previous_state: "Awaiting Information",
      new_state: "In Progress",
      remark: description || `Complainant uploaded requested document: ${file.name}. Status advanced to In Progress.`,
      metadata: {
        action: "COMPLAINANT_DOCUMENT_SUBMITTED",
        file_name: file.name,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    addTimelineEvent(caseRef, {
      id: makeId("tl"),
      case_id: c.id,
      actor_id: null,
      actor_role: "COMPLAINANT",
      actor_name: "Aarav Sharma (Verified Student)",
      event_type: "NOTE_ADDED",
      previous_state: c.status,
      new_state: c.status,
      remark: description || `Complainant uploaded supplemental document: ${file.name}`,
      metadata: {
        action: "COMPLAINANT_DOCUMENT_SUBMITTED",
        file_name: file.name,
      },
      timestamp: new Date().toISOString(),
    });
  }

  const att: StudentCaseAttachment = {
    id: "att-mock-" + Date.now(),
    file_name: file.name,
    file_size_bytes: file.size,
    mime_type: file.type || "application/pdf",
    secure_url: "#",
    category: "COMMUNICATION_RECORD",
    description: description || "Requested supplemental document submitted by complainant",
    created_at: new Date().toISOString(),
  };

  return {
    attachment: att,
    case_reference_id: caseRef,
    new_status: newStatus,
    message: `Document '${file.name}' securely uploaded and registered.`,
  };
}
