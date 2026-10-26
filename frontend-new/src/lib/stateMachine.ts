/**
 * State machine — single source of truth for all case lifecycle transitions.
 * Reused by: Case Dossier UI, Change Status modal, State Machine screen,
 * and mock API handlers.
 *
 * Derived from backend/app/services/lifecycle.py — must stay in sync.
 */

import type { CaseStatus } from "@/types/ui";

export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  Received: ["Registered"],
  Registered: ["Under Triage"],
  "Under Triage": ["Assigned"],
  Assigned: ["In Progress"],
  "In Progress": ["Awaiting Information", "Under Review"],
  "Awaiting Information": ["In Progress"],
  "Under Review": ["In Progress", "Resolved"],
  Resolved: ["Closed", "In Progress"], // In Progress = Reopen
  Closed: [], // Terminal — no further transitions
  Rejected: [], // Terminal — rejected malformed or spam case
};

/** All 9 lifecycle progression states in display order. */
export const ALL_STATUSES: CaseStatus[] = [
  "Received",
  "Registered",
  "Under Triage",
  "Assigned",
  "In Progress",
  "Awaiting Information",
  "Under Review",
  "Resolved",
  "Closed",
];

export const ALL_POSSIBLE_STATUSES: CaseStatus[] = [...ALL_STATUSES, "Rejected"];

/** Returns valid next states for a given current state. */
export function getAllowedTransitions(from: CaseStatus): CaseStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

/** Returns true if the transition from → to is legal. */
export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}

/** Returns true if status is terminal (no further transitions possible). */
export function isTerminal(status: CaseStatus): boolean {
  return (ALLOWED_TRANSITIONS[status] ?? []).length === 0;
}

/** Returns true if the case is considered "active" (not Resolved, Closed, or Rejected). */
export function isActive(status: CaseStatus): boolean {
  return status !== "Resolved" && status !== "Closed" && status !== "Rejected";
}

/** Guard rules displayed in the State Machine screen and dossier modal. */
export const TRANSITION_GUARD_RULES: Record<CaseStatus, string[]> = {
  Received: ["Mandatory remarks required"],
  Registered: ["Mandatory remarks required"],
  "Under Triage": [
    "Bureau must be confirmed before assigning",
    "Mandatory remarks required",
  ],
  Assigned: ["Officer must be assigned", "Mandatory remarks required"],
  "In Progress": ["Mandatory remarks required"],
  "Awaiting Information": ["Mandatory remarks required"],
  "Under Review": ["Mandatory remarks required"],
  Resolved: [
    "Closure remarks become the permanent record",
    "Mandatory remarks required",
  ],
  Closed: ["Terminal state — no further transitions allowed"],
  Rejected: ["Terminal state — isolated from MTTR analytics"],
};

/** Step index for the linear progress tracker in the Case Dossier header. */
export const STATUS_STEP_INDEX: Record<CaseStatus, number> = {
  Received: 0,
  Registered: 1,
  "Under Triage": 2,
  Assigned: 3,
  "In Progress": 4,
  "Awaiting Information": 4, // same step as In Progress (bi-directional)
  "Under Review": 5,
  Resolved: 6,
  Closed: 7,
  Rejected: -1,
};

/** Human-readable labels for audit event types. */
export const AUDIT_EVENT_LABELS: Record<string, string> = {
  REGISTERED: "Case Registered",
  STATUS_CHANGE: "Status Changed",
  REASSIGNED: "Case Reassigned",
  NOTE_ADDED: "Note Added",
  ESCALATED: "Case Escalated",
  RESOLVED: "Case Resolved",
  CLOSED: "Case Closed",
  REOPENED: "Case Reopened",
  REJECTED: "Case Rejected / Marked as Spam",
  TRIAGE_APPLIED: "Triage Classification Applied",
};
