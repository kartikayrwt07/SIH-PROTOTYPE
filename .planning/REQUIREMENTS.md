# Requirements: AICTE Integrated Complaint Case Monitoring Dashboard

**Defined:** 2026-10-24
**Core Value:** Provide dependable, auditable cross-bureau case tracking and transparent SLA risk monitoring across institutional complaints with strict data integrity, explainable intelligence, and zero fabricated official assertions.

## v1 Requirements

### Core Architecture & Foundation (ARCH)

- [x] **ARCH-01**: Modular backend architecture with FastAPI, SQLAlchemy 2.0 async/sync ORM, Pydantic v2 schemas, and Alembic migrations.
- [x] **ARCH-02**: Modern, accessible React + TypeScript + Vite frontend with curated design tokens, clear visual hierarchy, and responsive layout.
- [x] **ARCH-03**: Dual-database compatibility (SQLite for fast local development and unit tests; PostgreSQL ready for deployment).
- [x] **ARCH-04**: Database seeding command generating realistic synthetic institutions, complaint cases, assignments, and audit records with zero real personal data.

### RBAC & Security (SEC)

- [x] **SEC-01**: Role-Based Access Control enforcing least privilege across 4 roles: Platform Administrator, Central Dashboard Viewer / Supervisor, Bureau/Cell Case Officer, and Read-Only Auditor.
- [x] **SEC-02**: Server-side permission enforcement on all API routes, preventing Insecure Direct Object References (IDOR) and unauthorized bureau cross-access.
- [x] **SEC-03**: Separation of internal sensitive case notes and confidential complainant descriptions from general public/audit summaries.
- [x] **SEC-04**: Interactive demo role-switcher widget prominently flagged as development/demo-only, completely bypassed or deactivated in production mode.

### Case Lifecycle & State Machine (LIFE)

- [x] **LIFE-01**: Validated state machine enforcing permitted transitions: `Received -> Registered -> Under Triage -> Assigned -> In Progress -> Awaiting Information -> Under Review -> Resolved -> Closed`.
- [x] **LIFE-02**: Rejection of invalid status transitions with structured error responses and explanation of required pre-conditions.
- [x] **LIFE-03**: Mandatory capture of transition metadata (acting user, timestamp, previous status, new status, and reason/resolution remarks).
- [x] **LIFE-04**: Support for authorized case reopening and closure workflows requiring formal closure rationale.

### Case Register & Detail (CASE)

- [x] **CASE-01**: Paginated, server-side sorted and filtered case register with stable, collision-free case reference IDs (e.g. `AICTE-2026-XXXX`).
- [x] **CASE-02**: Multi-parameter search across institution name, complaint subject, category, bureau/cell, and current status.
- [x] **CASE-03**: Comprehensive Case Detail view displaying complete metadata, institution profile, SLA deadline status, and assigned officer.
- [x] **CASE-04**: Chronological, append-oriented activity audit timeline reflecting every assignment, status change, escalation, and note.

### Assignment, Escalation & SLA Engine (SLA)

- [x] **SLA-01**: Configurable SLA policy rules calculating case deadlines and risk thresholds based on case priority, category, and bureau.
- [x] **SLA-02**: Real-time SLA aging computation distinguishing "On Track", "Approaching Deadline (< 48h)", and "Breached / Overdue".
- [x] **SLA-03**: Bureau and officer assignment/reassignment workflow with audit history capturing reason for transfer.
- [x] **SLA-04**: Supervisory escalation mechanism flagging cases exceeding risk thresholds or stalled in queues.

### Dashboard & Analytics (DASH)

- [x] **DASH-01**: Executive and Bureau-specific overview metric cards (Total, Open, Pending Action, Overdue, Approaching Deadline, Resolved).
- [x] **DASH-02**: Visual breakdown of case distribution by bureau/cell, status pipeline, and category.
- [x] **DASH-03**: SLA / Aging Risk Radar panel highlighting cases requiring urgent intervention with clear explainability of warning drivers.
- [x] **DASH-04**: Bottleneck & cycle time analytics showing average dwell time per lifecycle stage without punitive institution rankings.

### Data Import & Export (DATA)

- [ ] **DATA-01**: CSV import engine with schema validation, dry-run preview, field-level error reporting, and duplicate collision warnings.
- [ ] **DATA-02**: Transaction-safe batch ingestion ensuring corrupted CSV rows do not partially write or poison the database.
- [ ] **DATA-03**: Role-scoped CSV export utility respecting field redaction and user authorization boundaries.

### Explainable Intelligence (AI)

- [ ] **AI-01**: Deterministic duplicate complaint detection using text tokenization and TF-IDF cosine similarity against existing registered cases.
- [ ] **AI-02**: Explainable category and bureau routing recommender based on keyword heuristics and historical patterns with confidence score.
- [ ] **AI-03**: Transparent rationale breakdown display explaining exactly *why* a category, bureau, or duplicate match was suggested.
- [ ] **AI-04**: Strict Human-in-the-Loop decision gate: recommendations require explicit officer acceptance or rejection; never auto-committed.

## v2 Requirements (Deferred)

- **V2-01**: Direct integration with official AICTE backend via secure government gateway APIs when authorized.
- **V2-02**: Multilingual grievance submission and automated Indian language translation (Bhashini API integration).
- **V2-03**: Real-time SMS and WhatsApp webhook notifications for complainant status updates.
- **V2-04**: Local offline-first PWA mode for field inspectors and regional bureau visits.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live production AICTE database scraping/connection | Unauthorized and violates security boundaries during hackathon. |
| Hardcoded statutory bureau names or legal SLA deadlines | Operating policies vary and are non-public; must remain dynamic and configurable. |
| Autonomous case resolutions or liability determinations | AI cannot make judicial or administrative decisions; purely advisory. |
| Public institution penalty scoreboards / shaming lists | Risks stigmatizing institutions based on unverified allegations or biased data. |
| Heavy distributed queues (Kafka/RabbitMQ) | Overkill for hackathon scale; introduces unnecessary infrastructure friction. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Satisfied |
| ARCH-02 | Phase 1 | Satisfied |
| ARCH-03 | Phase 1 | Satisfied |
| ARCH-04 | Phase 1 | Satisfied |
| SEC-01 | Phase 2 | Satisfied |
| SEC-02 | Phase 2 | Satisfied |
| SEC-03 | Phase 2 | Satisfied |
| SEC-04 | Phase 2 | Satisfied |
| LIFE-01 | Phase 3 | Satisfied |
| LIFE-02 | Phase 3 | Satisfied |
| LIFE-03 | Phase 3 | Satisfied |
| LIFE-04 | Phase 3 | Satisfied |
| CASE-01 | Phase 4 | Satisfied |
| CASE-02 | Phase 4 | Satisfied |
| CASE-03 | Phase 4 | Satisfied |
| CASE-04 | Phase 4 | Satisfied |
| SLA-01 | Phase 5 | Satisfied |
| SLA-02 | Phase 5 | Satisfied |
| SLA-03 | Phase 5 | Satisfied |
| SLA-04 | Phase 5 | Satisfied |
| DASH-01 | Phase 6 | Satisfied |
| DASH-02 | Phase 6 | Satisfied |
| DASH-03 | Phase 6 | Satisfied |
| DASH-04 | Phase 6 | Satisfied |
| DATA-01 | Phase 7 | Pending |
| DATA-02 | Phase 7 | Pending |
| DATA-03 | Phase 7 | Pending |
| AI-01 | Phase 8 | Pending |
| AI-02 | Phase 8 | Pending |
| AI-03 | Phase 8 | Pending |
| AI-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Satisfied: 24 (75.0%)
- Pending: 8 (25.0%)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-24*
*Last updated: 2026-10-24 after Phase 6 completion*
