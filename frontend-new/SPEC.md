# Build: "AICTE Integrated Complaint Case Monitoring Dashboard" (Smart India Hackathon)

A role-based web app for monitoring institutional grievances across AICTE bureaus (Approval, Policy & Academic, Skill Development & Training, Administration). This is the FRONTEND. A separate backend exists, but its full API details are not available yet, so the app must be built MOCK-FIRST, with all backend assumptions isolated in one place (section 2) so they can be swapped later without touching UI code.

## 0. Guiding principles
- Clean, calm, and simple. A first-time government user should understand every screen in under 10 seconds.
- One purpose per screen, one primary action per screen, generous whitespace, few colours.
- Plain-language labels and short helper text. Use tooltips to explain terms like "SLA".
- Flat cards with a 1px border and a very soft shadow. No glassmorphism, no heavy gradients. A subtle blur is allowed only behind modals and drawers.

## 1. Tech stack
React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Recharts, Lucide icons. Lazy-load routes.

## 2. Data layer: mock-first, swappable (IMPORTANT)

**Fixed contract.** This one interface and these enums come from the real backend. Use them EXACTLY. Never rename, remove or add fields, and keep enum strings exactly as written (e.g. "Under Triage" with a space):

```typescript
type UserRole = "ADMIN" | "SUPERVISOR" | "OFFICER" | "AUDITOR";
type CasePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type CaseStatus = "Received" | "Registered" | "Under Triage" | "Assigned" | "In Progress" | "Awaiting Information" | "Under Review" | "Resolved" | "Closed";

interface ComplaintCase {
  id: string;
  case_reference_id: string; // e.g. "AICTE-2026-00104"
  institution_id: string;
  institution_name: string;
  aicte_permanent_id: string; // e.g. "1-3324561"
  bureau_id: string;
  bureau_code: "APPR" | "PAB" | "SDC" | "ADMIN_BUR";
  bureau_name: string;
  assigned_officer_id?: string;
  assigned_officer_name?: string;
  subject: string;
  description_redacted: string;
  description_confidential?: string;
  category: string;
  priority: CasePriority;
  status: CaseStatus;
  due_date: string;
  escalation_level: number; // 0=Normal, 1=Approaching, 2=Overdue
  created_at: string;
}
```

**Everything else is an ASSUMPTION** (the real backend's shapes are unknown). Define all other types (Bureau, Officer, Note, TimelineEntry, AssignmentHistoryEntry, DashboardStats, TriageResult, DuplicateMatch, CsvRowResult, CsvCommitResult, ListCasesResponse) only in `src/types/assumed.ts`, with a comment at the top: "ASSUMED SHAPES: verify against backend."

**Architecture (follow exactly):**
- `src/api/endpoints.ts`: every URL path in one object, each marked ASSUMED.
- `src/api/client.ts`: the only place that calls fetch. Contains one `getAuthHeaders(role, bureauId)` function (assume headers `X-User-Role` and `X-User-Bureau-Id`) and normalises every error to `{ message: string }`.
- `src/api/adapters.ts`: one mapper function per response type, converting backend JSON into the UI types. For now they are identity functions, so any backend mismatch can later be fixed here.
- `src/api/mock/`: an in-memory mock backend (no localStorage) with 58 seeded cases. All mutations (change status, reassign, escalate, add note, apply triage, commit CSV) must work and update the store, so the demo is fully interactive. Simulate 300–600ms latency.
- `src/api/index.ts`: exposes typed functions (listCases, getCase, transitionCase, reassignCase, escalateCase, addNote, getTimeline, getAssignmentHistory, getDashboardStats, getSlaRadar, checkDuplicates, runTriage, applyTriage, previewCsv, commitCsv, listBureaus, listOfficers). Each one routes to the mock or the real client based on `VITE_USE_MOCKS`.
- Env vars: `VITE_USE_MOCKS` (default `true`) and `VITE_API_BASE_URL`.
- Components and pages must ONLY use TanStack Query hooks built on `src/api/index.ts`. Never call fetch directly and never read raw backend JSON in components.
- Client-side logic that the backend may later replace must sit behind the API functions: TF-IDF duplicate detection and rule-based triage (in `src/lib/triage/`), CSV validation, SLA status derivation, and dashboard stats and dwell-time calculation.
- Generate `API_CONTRACT.md` in the project root listing every assumed endpoint (method, path, request, example response) and every assumed header, so it can be compared against the real backend later.
- Do not render any field that is not in `ComplaintCase` or the assumed types. For example, do not show State/District or complainant name/phone. Show institution name, AICTE ID, bureau and category.
- Treat all optional fields as possibly missing, and handle unexpected backend errors with friendly messages.

## 3. Design system (light, clean GovTech)
- **Fonts:** Inter for UI (tabular numerals for all numbers and countdowns). JetBrains Mono for case reference IDs only.
- **Colours (define as theme tokens):**
  - Page background `#F5F7FB`, cards `#FFFFFF`, borders `#E3E8F2`.
  - Text: primary `#0F1A33`, secondary `#4A5878`, muted `#5F6E8C` (at least 4.5:1 contrast).
  - Sidebar and top accent: deep navy `#0B132B` with white text.
  - Primary action colour: Tech Blue `#2563EB`.
  - Saffron `#F97316` is BRANDING ONLY: a 3px marker on the active nav item and a small accent in the logo. Never use it for status, priority or SLA.
  - SLA pills (soft background + strong text): On Track `#059669` on `#D1FAE5`; Approaching `#B45309` on `#FEF3C7`; Overdue `#DC2626` on `#FEE2E2`.
- **Status chips:** one neutral style (white pill, thin border, coloured dot + text label): Received `#64748B`, Registered `#3B82F6`, Under Triage `#8B5CF6`, Assigned `#06B6D4`, In Progress `#0284C7`, Awaiting Information `#EAB308`, Under Review `#EC4899`, Resolved `#10B981`, Closed `#475569`.
- **Priority:** a small bars icon (1 to 4 bars) + label in neutral text. Only URGENT is shown in red text.
- **Shape and motion:** radius 12px cards, 8px inputs and buttons. Transitions 150–200ms, honour `prefers-reduced-motion`.
- **Tables:** compact rows (about 44px), sticky header, solid background, row hover highlight.
- **Charts:** restrained palette, minimal gridlines, clean tooltips. Over-threshold bars turn red.
- Light theme by default. A dark mode toggle is optional and lowest priority.
- Use a text wordmark ("AICTE · Case Monitor"), not an official logo.

## 4. Layout and navigation
- Left sidebar (260px, collapses to 72px icons only). Items: Dashboard, Case Register, SLA Radar, Smart Triage, CSV Ingestion, State Machine. (The Case Dossier opens from the register, not the sidebar.)
- Top bar: breadcrumbs on the left; on the right a "Viewing as" role switcher showing the current role with a one-line description, plus a small "Demo mode" tag.
- Every page: title + one-line description, then content. Mobile: sidebar becomes a drawer, tables scroll horizontally.

## 5. Roles (demo switcher + permissions)
The switcher lets judges test 4 roles live. The frontend hides or disables UI by role (real enforcement belongs to the backend). Pass the active role and bureau through `getAuthHeaders` only.
- **ADMIN:** all bureaus; transitions, reassign, escalate, CSV ingest, AI triage.
- **SUPERVISOR:** all bureaus; escalate, reassign, transitions, audit trail.
- **OFFICER:** one bureau only (the switcher lets you pick which, default Approval). Transitions, notes, view dossier. No escalate, cannot see other bureaus.
- **AUDITOR:** read-only, all bureaus. Hide Transition, Reassign, Escalate and Ingest. Complainant PII and `description_confidential` show as `[REDACTED FOR AUDITOR]` with a lock badge: "🔒 Confidential Complainant Statement Redacted under Data Governance Policy". In the mock backend, omit `description_confidential` for AUDITOR requests, and also redact in the UI. CSV export must exclude confidential data.

## 6. Screens

**Dashboard (`/dashboard`)**
- Row of 6 KPI cards: Total Cases, Active Open, Approaching SLA, Overdue, Resolved/Closed, Resolution Rate. Compute from data, never hardcode.
- Four bureau cards (APPR, PAB, SDC, ADMIN_BUR): case count, overdue count, completion bar. Clicking one opens the Case Register filtered to that bureau.
- One bar chart: average dwell time for Under Triage, Awaiting Information, Under Review. Bars above threshold turn red with a "Bottleneck" badge. Thresholds are editable constants: 24h, 72h, 48h.

**Case Register (`/cases`)**
- Toolbar: search (reference ID, institution, subject), filters (Bureau, Status, Priority, SLA status), Export CSV, Ingest CSV (role-gated).
- Columns: Case Reference (mono), Institution (name, AICTE ID as small subtext), Bureau, Priority, Status, SLA pill with hours left, chevron. Category and Created Date appear in the preview drawer.
- Clicking a row opens a quick preview drawer with an "Open Dossier" button. Pagination: 10/25/50. Filtering and pagination live behind `listCases(params)` returning `{ items, total }`.

**Case Dossier (`/cases/:id`)** (route param is `ComplaintCase.id`)
- Header: reference ID (mono), status chip, priority, escalation pill, SLA countdown.
- Two columns. Left: institution/category panel, subject, description (redaction rules above), then tabs: Audit Timeline (append-only: status change, actor, role, time, remarks), Internal Notes (with a "Mark as confidential" checkbox), Assignment History.
- Right (sticky): a horizontal 9-step status tracker with the current step highlighted, then buttons: Change Status, Reassign, Escalate (role-gated).
- Change Status modal: only valid next states, remarks required. Reassign modal: bureau and/or officer + mandatory transfer reason. Show clear inline errors, including any rejection message from the API layer.

**SLA Radar (`/sla-radar`)**
- Three summary tiles (Overdue, Approaching, On Track) and a bureau filter.
- Section "Overdue": red-bordered table with hours overdue and an Escalate button (ADMIN/SUPERVISOR). Section "Approaching": amber table with countdown timers (update every minute).

**Smart Triage (`/ai-triage`)**: two tabs, rule-based and explainable
- *Duplicate Check:* subject, description and institution inputs, then "Run Duplicate Check". Show matches with similarity % (e.g. "87% Match"), matched keyword tags, and a "Compare side by side" modal.
- *Bureau Triage:* paste grievance text (or pick an existing case) and get Recommended Bureau, Category, Priority and Confidence (e.g. "92% High Confidence"). Show a rationale list: matched keyword, weight %, resulting route (weights sum to 100%). "Apply Recommendation" updates the case and writes an audit entry.

**CSV Ingestion (`/ingest`)**: a 3-step wizard (Upload → Review → Commit), not a modal
- Step 1: drag-and-drop area + "Download sample template". Columns: `institution_aicte_id, bureau_code, subject, category, priority, description, is_confidential`.
- Step 2: validation table. Invalid rows get a red badge with the exact error (bad AICTE ID, unknown bureau code, invalid priority, etc.). Assumed AICTE ID pattern: `^\d-\d{7}$`. Keep the rules in one config object. `is_confidential` accepts true/false.
- Step 3: summary ("12 valid, 2 invalid"), "Commit valid rows" button, then show the generated reference IDs.

**State Machine (`/state-machine`)**
- A simple node graph of the 9 states with valid transitions as arrows. Clicking a state shows its allowed next states and guard rules in a side panel. A "Try an illegal move" demo shows the validation error.

## 7. Business rules
- **State machine** lives in one constant at `src/lib/stateMachine.ts`, reused by the dossier, modal and simulator: Received→Registered; Registered→Under Triage; Under Triage→Assigned; Assigned→In Progress; In Progress↔Awaiting Information; In Progress→Under Review; Under Review→Resolved; Resolved→Closed; Resolved→In Progress (Reopen).
- **SLA status** (derive from `due_date`, ignore Resolved/Closed): Overdue if past due; Approaching if due within 48h; otherwise On Track. The "Escalate" action sets `escalation_level` to the next level (max 2) and writes a timeline entry.
- **KPIs:** Active Open = everything except Resolved/Closed. Resolution Rate = (Resolved + Closed) / Total.
- Display times in IST.

## 8. Quality
- Every screen has loading skeletons, an empty state, and an error state with retry. Use toasts for success/failure.
- Never rely on colour alone: status and SLA always include text or an icon. Keyboard accessible, visible focus rings.

## 9. Mock data
Seed 58 deterministic cases: APPR 22, PAB 14, SDC 11, ADMIN_BUR 11. 14 Resolved/Closed, 44 active (8 Overdue, 9 Approaching, 27 On Track). Include timelines, notes and assignment history for several cases, plus realistic Indian institution names and AICTE IDs. Reference IDs follow `AICTE-2026-00001` and upwards (5 digits).

## 10. Build order and acceptance
Build in this order, confirming each step works before moving on: (1) scaffold, theme tokens, the full `src/api` layer + mocks + `API_CONTRACT.md`, layout, role switcher; (2) Dashboard + Case Register; (3) Dossier; (4) SLA Radar; (5) Smart Triage; (6) CSV Ingestion; (7) State Machine.
Done when: switching roles visibly changes permissions; illegal transitions are blocked with a clear message; the Auditor never sees confidential text; clicking a bureau card filters the register; all mutations work against the mock; and the app can later point at a real backend by editing only `src/api/endpoints.ts`, `src/api/adapters.ts`, `src/api/client.ts` and the env vars.