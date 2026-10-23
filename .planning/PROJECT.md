# AICTE Integrated Complaint Case Monitoring Dashboard

## What This Is

A centralized, role-based complaint monitoring and lifecycle tracking platform designed for authorized personnel across AICTE bureaus and cells. It provides cross-bureau visibility into institution-related cases, auditable transition histories, configurable SLA/aging risk radar, and explainable assistance for categorization, duplicate detection, and routing.

## Core Value

Provide dependable, auditable cross-bureau case tracking and transparent SLA risk monitoring across institutional complaints with strict data integrity, explainable intelligence, and zero fabricated official assertions.

## Business Context

- **Customer / Primary User**: Authorized AICTE Bureau/Cell Case Officers, Supervisors/Viewers, Auditors, and Platform Administrators.
- **Success Metric**: 100% end-to-end case traceability from registration to closure with zero orphaned cases, auditable timeline integrity, and sub-second dashboard metric responsiveness.
- **Hackathon Alignment**: Smart India Hackathon (SIH) prototype demonstrating clean architecture, explainable AI assistance with deterministic fallbacks, realistic synthetic datasets, and complete RBAC.

## Requirements

### Validated

- ✓ **ARCH-01**: Modular backend architecture with FastAPI, SQLAlchemy 2.0 ORM, and Pydantic v2 schemas — Phase 1
- ✓ **ARCH-02**: Accessible React 18 + TypeScript + Vite frontend with design tokens and responsive layout — Phase 1
- ✓ **ARCH-03**: Dual-database compatibility (SQLite for local dev, PostgreSQL for production) — Phase 1
- ✓ **ARCH-04**: Database seeding command generating 50+ realistic synthetic cases across 9 states with zero PII — Phase 1

### Active

- [ ] **MVP-01**: Central Dashboard with filterable aggregate overview metrics derived dynamically from case records.
- [ ] **MVP-02**: Paginated, searchable Case Register with stable identifiers, multi-criteria filtering, and export.
- [ ] **MVP-03**: Comprehensive Case Detail view with timeline audit trail, internal notes vs. public summaries, and linked cases.
- [ ] **MVP-04**: Explicit validated state machine for case lifecycle (Received -> Registered -> Under Triage -> Assigned -> In Progress -> Awaiting Information -> Under Review -> Resolved -> Closed).
- [ ] **MVP-05**: Bureau/cell case assignment and reassignment tracking with mandatory reason capture and escalation flags.
- [ ] **MVP-06**: Configurable SLA policy engine calculating due dates, business days, and transparent aging risk indicators.
- [ ] **MVP-07**: Validated CSV import pipeline with pre-validation preview, batch reporting, and synthetic dataset seeder.
- [ ] **MVP-08**: Multi-parameter search, filtering, and role-scoped CSV report exports.
- [ ] **MVP-09**: Resilient error handling, defensive UI empty/loading/error states, and comprehensive system diagnostics.
- [ ] **DIFF-01**: Cross-Bureau Case Visibility & comparative throughput analytics (without toxic public ranking).
- [ ] **DIFF-02**: Explainable Complaint Intelligence (deterministic TF-IDF duplicate detection and rule-based category/bureau routing with clear evidence rationale).
- [ ] **DIFF-03**: Visual SLA & Aging Risk Radar explaining drivers behind impending breach warnings.
- [ ] **DIFF-04**: Tamper-evident chronological audit trail for all status, ownership, and note mutations.

### Out of Scope

- Direct live integration with production AICTE databases or confidential government portals (Unauthorized and out of hackathon scope; synthetic adapter interfaces used instead).
- Hardcoded official AICTE bureaus, hierarchies, statutory deadlines, or real officer names (Configurable illustrative schema used to avoid misrepresenting non-public procedures).
- Automated case merging or autonomous legal/disciplinary findings (AI is advisory only; human in the loop required).
- Public naming-and-shaming or non-contextual institution penalty scoreboards (Protects institution reputation against raw/unverified complaint bias).
- Distributed microservices, Apache Kafka, or multi-cluster Kubernetes (Avoid premature complexity; single modular monolith satisfies all requirements).

## Context

- Problem Statement: "Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells".
- Development Context: Hackathon MVP to be evaluated on software engineering fundamentals, workflow completeness, security/privacy by design, explainability, and presentation polish.
- Privacy & Ethics: Complaint text may simulate sensitive allegations; synthetic data only, local redaction before any external model calls, zero sensitive data in logs.

## Constraints

- **Tech Stack**: Python (FastAPI, SQLAlchemy, Pydantic, Alembic) + React (TypeScript, Vite, Vanilla CSS / Tailwind tokens, Lucide icons, accessible components).
- **Database**: SQLite for zero-friction local execution / unit tests; PostgreSQL compatible schema for containerized demo.
- **Intelligence**: Primary intelligence features must run deterministically (Scikit-Learn TF-IDF, pattern matchers) with zero hard dependency on paid third-party API keys.
- **Security**: Server-side RBAC enforcement (deny-by-default); development role switcher strictly demarcated as demo-only.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modular Monolith (FastAPI + React) | Eliminates distributed systems overhead while providing clean separation of UI, API, domain, and data layers | — Pending |
| Deterministic Baseline for Intelligence | TF-IDF and keyword matching ensure 100% testable, zero-cost, reproducible duplicate detection and categorization during judging | — Pending |
| Configurable Org & SLA Schema | Prevents inventing official AICTE procedures while allowing judges to adapt bureaus and deadlines on the fly | — Pending |
| Append-Only Audit Event Model | Ensures full traceability for all lifecycle transitions, reassignments, and notes | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-24 after initialization*
