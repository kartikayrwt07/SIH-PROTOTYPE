# Roadmap: AICTE Integrated Complaint Case Monitoring Dashboard

## Overview

A phased journey delivering a production-grade, hackathon-ready institutional complaint monitoring platform. The roadmap advances from fundamental architectural scaffolds and relational data models, through robust security/RBAC and deterministic state machine transitions, to responsive UI registers, real-time SLA risk tracking, cross-bureau executive analytics, safe batch CSV data pipelines, and transparent, human-in-the-loop explainable intelligence.

## Phases

- [x] **Phase 1: Project Scaffolding, Data Models & Synthetic Seeder** - Setup FastAPI, React/Vite, SQLite/Postgres ORM schemas, and realistic synthetic complaint dataset generator.
- [x] **Phase 2: Authentication, RBAC & Server-Side Authorization Gates** - Implement token/session handling, 4 distinct roles, least-privilege route dependencies, and demo role-switcher.
- [ ] **Phase 3: Case Lifecycle State Machine & Tamper-Evident Audit Trail** - Deterministic status transitions, transition guards, mandatory closure data, and immutable event logging.
- [ ] **Phase 4: Searchable Case Register & Interactive Case Detail Timeline** - High-density paginated case catalog, multi-criteria filtering, comprehensive case inspection, and chronological timeline.
- [ ] **Phase 5: Bureau Assignment Workflow & SLA Aging Risk Radar** - Assignment/transfer logging, dynamic SLA deadline calculations, working-day logic, and risk radar warnings.
- [ ] **Phase 6: Executive Cross-Bureau Monitoring Dashboard & Bottleneck Analytics** - Real-time aggregate KPIs, bureau workload comparisons, lifecycle dwell-time analytics, and visual charts.
- [ ] **Phase 7: Validated CSV Ingestion Pipeline & Role-Scoped Export Engine** - Dry-run preview, field-level validation, atomic batch ingestion, and permission-aware CSV reports.
- [ ] **Phase 8: Explainable AI Intelligence & Duplicate Detection Layer** - Deterministic TF-IDF duplicate matcher, rule-based triage classifier, transparent evidence cards, and human review gates.

## Phase Details

### Phase 1: Project Scaffolding, Data Models & Synthetic Seeder
**Goal**: Establish a modular monolith foundation with FastAPI backend, React/Vite frontend, shared type schemas, database ORM models, and a rich synthetic data generator.
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria**:
  1. Backend starts cleanly with FastAPI docs (`/docs`) exposing health check and core entity schemas.
  2. Frontend boots with Vite, displaying an accessible, theme-aligned application shell with responsive navigation.
  3. Running `python -m backend.seed` populates SQLite with at least 50 realistic synthetic complaints across multiple bureaus, statuses, and priorities.
  4. Unit tests verify database models and foreign key constraints.
**Plans**: 2 plans

Plans:
- [x] 01-01: Backend scaffolding, SQLAlchemy ORM models (Bureau, User, Institution, Case, Assignment, AuditLog), and database connection.
- [x] 01-02: Frontend scaffolding (React, TypeScript, Vite, CSS design tokens, layout shell) and synthetic data seeder script.

### Phase 2: Authentication, RBAC & Server-Side Authorization Gates
**Goal**: Enforce strict server-side access control across Platform Admin, Supervisor, Bureau Case Officer, and Auditor roles.
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria**:
  1. Unauthorized requests receive HTTP 401/403 with structured, safe error messages.
  2. Bureau Case Officers can only query and mutate cases belonging to their assigned bureau.
  3. Sensitive internal notes and complainant details are redacted from Read-Only Auditor and unprivileged responses.
  4. Interactive demo role-switcher allows instant context-switching during evaluation, clearly labelled as demo-only.
**Plans**: 2 plans

Plans:
- [x] 02-01: Backend auth dependencies, role-permission matrix, and bureau data-scoping middleware.
- [x] 02-02: Frontend auth state management, demo role-switcher bar, and protected route wrappers.

### Phase 3: Case Lifecycle State Machine & Tamper-Evident Audit Trail
**Goal**: Implement a strictly enforced, validated case state machine with append-only audit trail logging every mutation.
**Depends on**: Phase 2
**Requirements**: LIFE-01, LIFE-02, LIFE-03, LIFE-04
**Success Criteria**:
  1. State machine enforces valid path: `Received -> Registered -> Under Triage -> Assigned -> In Progress -> Awaiting Information -> Under Review -> Resolved -> Closed`.
  2. Disallowed transitions (e.g. `Received -> Resolved`) are rejected with 422 Unprocessable Entity explaining the error.
  3. Every status transition creates an immutable audit record containing actor, timestamp, old state, new state, and rationale.
  4. Resolving or closing a case mandates recorded closure remarks and resolution category.
**Plans**: 2 plans

Plans:
- [x] 03-01: Backend state machine engine, transition validation guards, and audit event logger.
- [x] 03-02: Backend API endpoints for state advancement, reopening, and audit history retrieval with comprehensive tests.

### Phase 4: Searchable Case Register & Interactive Case Detail Timeline
**Goal**: Deliver high-performance, filterable case register and an in-depth case inspection workspace with a chronological activity stream.
**Depends on**: Phase 3
**Requirements**: CASE-01, CASE-02, CASE-03, CASE-04
**Success Criteria**:
  1. Users can search and filter cases by keyword, status, priority, bureau, institution, and date range with instant response.
  2. Case Detail screen cleanly renders complete case metadata, institution profile, SLA deadline, and active assignee.
  3. Activity timeline presents chronological cards for registrations, transfers, status changes, and internal notes.
  4. Confidential case notes are visible only to authorized roles with visual privacy indicators.
**Plans**: 2 plans

Plans:
- [x] 04-01: Case Register table component with server-side pagination, sorting, search, and badge indicators.
- [x] 04-02: Case Detail view with tabbed timeline, case metadata card, and internal notes composer.

### Phase 5: Bureau Assignment Workflow & SLA Aging Risk Radar
**Goal**: Enable seamless case delegation across bureaus and officers, backed by a dynamic SLA policy engine and aging risk alerts.
**Depends on**: Phase 4
**Requirements**: SLA-01, SLA-02, SLA-03, SLA-04
**Success Criteria**:
  1. Authorized users can assign or transfer cases to other bureaus/officers with mandatory transfer reason.
  2. Configurable SLA policies compute target resolution deadlines based on case severity and category.
  3. System dynamically calculates remaining hours and classifies cases into "On Track", "Approaching Deadline", and "Overdue".
  4. Escalation trigger flags neglected or overdue cases directly for supervisory review.
**Plans**: 2 plans

Plans:
- [ ] 05-01: SLA calculation engine, working calendar logic, and bureau assignment/transfer endpoints.
- [ ] 05-02: Frontend assignment action modal, transfer history drawer, and SLA Risk Radar indicator badges.

### Phase 6: Executive Cross-Bureau Monitoring Dashboard & Bottleneck Analytics
**Goal**: Deliver a comprehensive executive command center featuring aggregate operational metrics, bureau comparisons, and cycle time analytics.
**Depends on**: Phase 5
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria**:
  1. Executive dashboard renders dynamically computed KPI cards (Total, Open, Pending, Approaching Deadline, Overdue, Resolved).
  2. Bureau workload distribution chart clearly visualizes volume and pending backlog across bureaus.
  3. Lifecycle stage dwell-time chart highlights operational bottlenecks (e.g., average days spent in "Under Triage").
  4. Filters applied on the dashboard instantly update all metrics and charts without page reload.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Backend analytics aggregation services and query optimization with indexing.
- [ ] 06-02: Executive Dashboard page with KPI widgets, SVG/canvas chart components, and period filters.

### Phase 7: Validated CSV Ingestion Pipeline & Role-Scoped Export Engine
**Goal**: Build a resilient, transaction-safe data import engine with dry-run preview and permission-aware CSV reporting.
**Depends on**: Phase 6
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria**:
  1. CSV import parses uploaded files, validates schema and required fields, and renders a dry-run preview before committing.
  2. Malformed rows trigger granular line-by-line error messages without aborting or corrupting valid database records.
  3. Completed batch imports generate an audit record detailing processed, imported, and failed row counts.
  4. Authorized users can export filtered case lists to CSV with automatic redaction of restricted fields.
**Plans**: 2 plans

Plans:
- [ ] 07-01: Backend CSV parsing, validation schema, batch transactional ingestion, and export endpoint.
- [ ] 07-02: Frontend CSV Import modal with drag-and-drop, preview table, error badge summary, and export button.

### Phase 8: Explainable AI Intelligence & Duplicate Detection Layer
**Goal**: Introduce deterministic, explainable AI assistance for duplicate complaint detection and smart bureau triage suggestions.
**Depends on**: Phase 7
**Requirements**: AI-01, AI-02, AI-03, AI-04
**Success Criteria**:
  1. Scikit-Learn TF-IDF similarity engine detects potential duplicate complaints and surfaces similarity score + matching excerpts.
  2. Rule-based & keyword triage engine recommends optimal bureau and category for incoming unassigned cases.
  3. Transparent explanation cards explain *why* suggestions were generated (matched keywords, institutional history).
  4. Human-in-the-loop requirement enforced: recommendations require explicit officer click to apply; zero auto-mutations.
**Plans**: 2 plans

Plans:
- [ ] 08-01: Deterministic similarity service (TF-IDF vectorizer + cosine similarity) and triage recommendation rule engine.
- [ ] 08-02: Frontend intelligence suggestion cards on Case Detail and Triage views with Accept/Dismiss actions.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffolding & Data Models | 2/2 | Complete | 2026-10-24 |
| 2. RBAC & Security Gates | 2/2 | Complete | 2026-10-24 |
| 3. Case State Machine & Audit | 0/2 | Not started | - |
| 4. Case Register & Detail | 0/2 | Not started | - |
| 5. Assignment & SLA Engine | 0/2 | Not started | - |
| 6. Dashboard & Analytics | 0/2 | Not started | - |
| 7. CSV Ingestion & Export | 0/2 | Not started | - |
| 8. Explainable AI Intelligence | 0/2 | Not started | - |
