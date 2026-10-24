/**
 * In-memory mock store — mutable singleton, no persistence.
 * All mock mutations (transition, reassign, escalate, add note, apply triage,
 * commit CSV) update this store so the demo stays interactive across navigation.
 */

import type {
  ComplaintCase,
  TimelineEntry,
  Note,
  AssignmentHistoryEntry,
} from "@/types/ui";
import { INITIAL_CASES, MOCK_BUREAUS, MOCK_OFFICERS, BUREAU_OFFICERS } from "./data";

// ─── Store state ──────────────────────────────────────────────────────────────

export interface MockStore {
  cases: ComplaintCase[];
  timeline: Record<string, TimelineEntry[]>;   // keyed by case_reference_id
  notes: Record<string, Note[]>;               // keyed by case_reference_id
  history: Record<string, AssignmentHistoryEntry[]>; // keyed by case_reference_id
}

let _store: MockStore = {
  cases: [...INITIAL_CASES],
  timeline: {},
  notes: {},
  history: {},
};

/** Seed initial timeline and notes for the first 5 cases to demo those screens. */
function seedExtras() {
  const seedCases = _store.cases.slice(0, 5);
  for (const c of seedCases) {
    const now = new Date(c.created_at).getTime();

    _store.timeline[c.case_reference_id] = [
      {
        id: `tl-${c.case_reference_id}-1`,
        case_id: c.id,
        actor_id: "user-admin",
        actor_role: "ADMIN",
        actor_name: "Smt. Sunita Sharma",
        event_type: "REGISTERED",
        previous_state: null,
        new_state: "Received",
        remark: "Case registered via web portal.",
        metadata: { channel: "Web Portal", batch_id: "INIT-2026" },
        timestamp: new Date(now).toISOString(),
      },
      {
        id: `tl-${c.case_reference_id}-2`,
        case_id: c.id,
        actor_id: "user-supervisor",
        actor_role: "SUPERVISOR",
        actor_name: "Dr. Ramesh Chandra",
        event_type: "STATUS_CHANGE",
        previous_state: "Received",
        new_state: c.status,
        remark: `Transitioned to ${c.status} during grievance review.`,
        metadata: { remarks: `Transitioned to ${c.status} during grievance review.`, action: "execute_transition" },
        timestamp: new Date(now + 6 * 3600 * 1000).toISOString(),
      },
    ];

    if (c.status === "In Progress" || c.status === "Under Review") {
      _store.notes[c.case_reference_id] = [
        {
          id: `note-${c.case_reference_id}-1`,
          case_id: c.id,
          author_id: c.assigned_officer_id ?? "user-admin",
          author_name: c.assigned_officer_name ?? "System Admin",
          author_role: "OFFICER",
          content: `Formal inquiry notice dispatched to Registrar of ${c.institution_name}. Response pending within 7 working days.`,
          is_confidential: false,
          created_at: new Date(now + 12 * 3600 * 1000).toISOString(),
        },
        {
          id: `note-${c.case_reference_id}-2`,
          case_id: c.id,
          author_id: c.assigned_officer_id ?? "user-admin",
          author_name: c.assigned_officer_name ?? "System Admin",
          author_role: "OFFICER",
          content: `Confidential: Complainant has requested anonymity. Internal tracking only.`,
          is_confidential: true,
          created_at: new Date(now + 18 * 3600 * 1000).toISOString(),
        },
      ];

      _store.history[c.case_reference_id] = [
        {
          id: `hist-${c.case_reference_id}-1`,
          case_id: c.id,
          from_bureau_id: null,
          from_bureau_name: null,
          to_bureau_id: c.bureau_id,
          to_bureau_name: c.bureau_name,
          assigned_by_id: "user-supervisor",
          assigned_by_name: "Dr. Ramesh Chandra",
          transfer_reason: `Jurisdiction assigned to ${c.bureau_name} based on complaint category ${c.category}.`,
          created_at: new Date(now + 4 * 3600 * 1000).toISOString(),
        },
      ];
    }
  }
}

seedExtras();

// ─── Store accessors ──────────────────────────────────────────────────────────

export function getStore(): Readonly<MockStore> {
  return _store;
}

export function getCases(): ComplaintCase[] {
  return _store.cases;
}

export function getCaseByRef(ref: string): ComplaintCase | undefined {
  return _store.cases.find((c) => c.case_reference_id === ref || c.id === ref);
}

export function updateCase(ref: string, patch: Partial<ComplaintCase>): ComplaintCase {
  const idx = _store.cases.findIndex((c) => c.case_reference_id === ref || c.id === ref);
  if (idx === -1) throw new Error(`Case ${ref} not found`);
  _store.cases[idx] = { ..._store.cases[idx], ...patch };
  return _store.cases[idx];
}

function resolveRef(ref: string): string {
  const c = _store.cases.find((c) => c.case_reference_id === ref || c.id === ref);
  return c ? c.case_reference_id : ref;
}

export function getTimeline(caseRef: string): TimelineEntry[] {
  return _store.timeline[resolveRef(caseRef)] ?? [];
}

export function addTimelineEvent(caseRef: string, event: TimelineEntry) {
  const ref = resolveRef(caseRef);
  if (!_store.timeline[ref]) _store.timeline[ref] = [];
  _store.timeline[ref].push(event);
}

export function getNotes(caseRef: string): Note[] {
  return _store.notes[resolveRef(caseRef)] ?? [];
}

export function addNote(caseRef: string, note: Note) {
  const ref = resolveRef(caseRef);
  if (!_store.notes[ref]) _store.notes[ref] = [];
  _store.notes[ref].push(note);
}

export function getHistory(caseRef: string): AssignmentHistoryEntry[] {
  return _store.history[resolveRef(caseRef)] ?? [];
}

export function addHistory(caseRef: string, entry: AssignmentHistoryEntry) {
  const ref = resolveRef(caseRef);
  if (!_store.history[ref]) _store.history[ref] = [];
  _store.history[ref].push(entry);
}

export function appendCase(c: ComplaintCase) {
  _store.cases.push(c);
}

/** Re-export data lookups for convenience */
export { MOCK_BUREAUS, MOCK_OFFICERS, BUREAU_OFFICERS };
