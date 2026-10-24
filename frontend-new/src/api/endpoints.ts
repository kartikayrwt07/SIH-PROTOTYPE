/**
 * API endpoint URL paths.
 * Every path is marked ASSUMED unless confirmed by live curl.
 * To point at a different backend, change ONLY this file and client.ts.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8001";

export const ENDPOINTS = {
  // Health
  health: `${BASE}/api/v1/health`,                           // CONFIRMED (live)

  // Auth
  login: `${BASE}/api/v1/auth/login`,                       // CONFIRMED (source)
  me: `${BASE}/api/v1/auth/me`,                             // CONFIRMED (source)
  switchDemoRole: (role: string) =>
    `${BASE}/api/v1/auth/switch-demo-role/${role}`,          // CONFIRMED (source)

  // Bureaus
  bureaus: `${BASE}/api/v1/bureaus`,                        // CONFIRMED (source)
  bureauOfficers: (bureauId: string) =>
    `${BASE}/api/v1/bureaus/${bureauId}/officers`,           // CONFIRMED (source)

  // Cases — list & CRUD
  cases: `${BASE}/api/v1/cases`,                            // CONFIRMED (source)
  caseDetail: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}`,                       // CONFIRMED (source)
  caseTransition: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/transition`,            // CONFIRMED (source)
  caseAssign: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/assign`,                // CONFIRMED (source)
  caseEscalate: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/escalate`,              // CONFIRMED (source)
  caseReopen: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/reopen`,                // CONFIRMED (source)

  // Timeline / notes / history
  caseTimeline: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/timeline`,              // ASSUMED
  caseNotes: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/notes`,                 // ASSUMED
  caseAssignmentHistory: (caseRef: string) =>
    `${BASE}/api/v1/cases/${caseRef}/assignment-history`,    // CONFIRMED (source)

  // SLA Radar
  slaRadar: `${BASE}/api/v1/cases/sla-radar`,               // ASSUMED path; confirmed shape

  // Dashboard
  dashboard: `${BASE}/api/v1/cases/dashboard`,               // ASSUMED

  // CSV I/O
  csvPreview: `${BASE}/api/v1/cases/import/preview`,         // CONFIRMED (source)
  csvCommit: `${BASE}/api/v1/cases/import/commit`,           // CONFIRMED (source)
  csvExport: `${BASE}/api/v1/cases/export/csv`,              // CONFIRMED (source)

  // AI / Triage (ASSUMED — backend has ai.py but shape unconfirmed)
  aiTriage: `${BASE}/api/v1/ai/triage`,                     // ASSUMED
  aiDuplicates: `${BASE}/api/v1/ai/duplicates`,             // ASSUMED
} as const;
