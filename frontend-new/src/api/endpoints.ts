/**
 * API endpoint URL paths aligned 100% with FastAPI backend v1 routes.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8001";

export const ENDPOINTS = {
  // Health
  health: `${BASE}/api/v1/health`,

  // Auth & RBAC
  login: `${BASE}/api/v1/auth/login`,
  register: `${BASE}/api/v1/auth/register`,
  me: `${BASE}/api/v1/auth/me`,
  switchDemoRole: (role: string) => `${BASE}/api/v1/auth/switch-demo-role/${role}`,

  // Bureaus
  bureaus: `${BASE}/api/v1/bureaus`,
  bureauOfficers: (bureauId: string) => `${BASE}/api/v1/bureaus/${bureauId}/officers`,

  // Cases — list & CRUD
  cases: `${BASE}/api/v1/cases`,
  caseDetail: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}`,
  caseTransition: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/transition`,
  caseAssign: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/assign`,
  caseEscalate: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/escalate`,
  caseReopen: (caseRef: string, reason: string) =>
    `${BASE}/api/v1/cases/${caseRef}/reopen?reason=${encodeURIComponent(reason)}`,
  caseReject: (caseRef: string, reason: string) =>
    `${BASE}/api/v1/cases/${caseRef}/reject?reason=${encodeURIComponent(reason)}`,

  // Timeline / notes / history / attachments
  caseTimeline: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/timeline`,
  caseNotes: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/notes`,
  caseAssignmentHistory: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/assignment-history`,
  caseAttachments: (caseRef: string) => `${BASE}/api/v1/cases/${caseRef}/attachments`,

  // SLA Radar
  slaRadar: `${BASE}/api/v1/cases/sla/radar`,

  // Dashboard & Analytics
  dashboardMetrics: `${BASE}/api/v1/dashboard/metrics`,
  dashboardBottlenecks: `${BASE}/api/v1/dashboard/bottlenecks`,
  dashboardWorkload: `${BASE}/api/v1/dashboard/workload`,
  dashboardInstitutions: `${BASE}/api/v1/dashboard/institutions`,

  // CSV I/O
  csvPreview: `${BASE}/api/v1/cases/import/preview`,
  csvCommit: `${BASE}/api/v1/cases/import/commit`,
  csvExport: `${BASE}/api/v1/cases/export/csv`,

  // Magic Zero-Shot AI Ingestion & Bhashini Multilingual
  magicAnalyze: `${BASE}/api/v1/cases/magic-analyze`,
  magicIngest: `${BASE}/api/v1/cases/magic-ingest`,

  // Explainable AI / Triage & Duplicates
  aiTriageSuggest: `${BASE}/api/v1/ai/triage/suggest`,
  aiTriageSuggestCase: (caseRef: string) => `${BASE}/api/v1/ai/triage/suggest/${caseRef}`,
  aiTriageApply: `${BASE}/api/v1/ai/triage/apply`,
  aiDuplicatesCheck: `${BASE}/api/v1/ai/duplicates/check`,
  aiDuplicatesCase: (caseRef: string, threshold = 0.7) =>
    `${BASE}/api/v1/ai/duplicates/${caseRef}?threshold=${threshold}`,

  // Smart Duplicate Grouping & Master Tickets
  masterTickets: `${BASE}/api/v1/ai/master-tickets`,
  masterTicketDetect: `${BASE}/api/v1/ai/master-tickets/detect`,
  masterTicketCreate: `${BASE}/api/v1/ai/master-tickets/create`,
  masterTicketResolve: (ticketRef: string) => `${BASE}/api/v1/ai/master-tickets/${ticketRef}/resolve`,
  masterTicketStats: `${BASE}/api/v1/ai/master-tickets/stats`,
  masterTicketInstitutions: `${BASE}/api/v1/ai/master-tickets/institution-breakdown`,
  masterTicketDetail: (ticketRef: string) => `${BASE}/api/v1/ai/master-tickets/${ticketRef}`,

  // Institution Trust Scores & Regulatory Actions
  institutionsAll: `${BASE}/api/v1/institutions/all`,
  institutionsTrustScores: `${BASE}/api/v1/institutions/trust-scores`,
  institutionsTrustSummary: `${BASE}/api/v1/institutions/trust-scores/summary`,
  institutionTrustScoreDetail: (institutionId: string) =>
    `${BASE}/api/v1/institutions/${institutionId}/trust-score`,
  institutionAction: (institutionId: string) =>
    `${BASE}/api/v1/institutions/${institutionId}/action`,

  // Telegram Bot Status Tracker
  telegramInfo: `${BASE}/api/v1/telegram/info`,
  telegramSimulate: `${BASE}/api/v1/telegram/simulate`,

  // Complainant Identity Verification
  identityOtpSend: `${BASE}/api/v1/identity/otp/send`,
  identityOtpVerify: `${BASE}/api/v1/identity/otp/verify`,
  identityVerifyToken: `${BASE}/api/v1/identity/verify-token`,
} as const;
