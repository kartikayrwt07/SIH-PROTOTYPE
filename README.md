# AICTE Integrated Complaint Case Monitoring Dashboard

> **Smart India Hackathon (SIH) Prototype & Enterprise Foundation**  
> *"Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells"*

A centralized, role-based complaint monitoring and lifecycle tracking platform for authorized personnel across AICTE bureaus and cells. Provides cross-bureau visibility into institution-related cases, auditable transition histories, configurable SLA/aging risk radar, and explainable intelligence for categorization and duplicate detection.

---

## 🏛️ System Architecture

The platform is designed as a **Modular Monolith** adhering to strict separation of concerns:

- **Backend**: FastAPI (Python 3.14 compatible), SQLAlchemy 2.0 ORM, Pydantic v2 schemas.
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS with custom accessible design system (AICTE Deep Navy, Academic Saffron, Slate).
- **Database**: Dual compatibility — local SQLite (`aicte_complaints.db`) with zero friction, PostgreSQL production-ready schemas.
- **Security**: Server-side RBAC (deny-by-default) across 4 roles (`ADMIN`, `SUPERVISOR`, `OFFICER`, `AUDITOR`) with IDOR protection and PII redaction.
- **Auditability**: Append-only tamper-evident audit trail recording every state change, reassignment, and note with actor and timestamp attribution.
- **SLA Surveillance**: Dynamic policy engine computing target resolution deadlines and classifying cases into `OVERDUE`, `APPROACHING` (<48h), `ON_TRACK`, and `COMPLETED`.

---

## 🚀 Quickstart Guide

### 1. Backend Setup & Seed Data

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database seeder (populates 58 synthetic cases across 4 bureaus, 15 institutions, and 6 SLA policies)
python -m backend.seed

# Launch FastAPI server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Run Vite development server
npm run dev
```
- Web Application URL: [http://localhost:5173](http://localhost:5173)

### 3. Automated Test Suite

```bash
# Run all backend tests (37 tests covering auth, state machine, search, assignment, SLA radar, analytics, CSV I/O)
python -m pytest backend/tests -v

# Run frontend production build & TypeScript validation
npm --prefix frontend run build
```

---

## 📊 Roadmap & Implementation Progress

| Phase | Description | Plans | Status |
|-------|-------------|:-----:|:------:|
| **Phase 1** | Project Scaffolding, Relational Data Models & 58-Case Synthetic Seeder | 2/2 | ✅ Completed |
| **Phase 2** | Authentication, Server-Side RBAC, Bureau IDOR Protection & Auditor PII Redaction | 2/2 | ✅ Completed |
| **Phase 3** | Deterministic 9-State Lifecycle State Machine & Tamper-Evident Audit Trail | 2/2 | ✅ Completed |
| **Phase 4** | Searchable Multi-Criteria Case Register & Interactive Case Detail Dossier Workspace | 2/2 | ✅ Completed |
| **Phase 5** | Bureau Assignment/Delegation Workflow & Real-Time SLA Aging Risk Radar | 2/2 | ✅ Completed |
| **Phase 6** | Executive Cross-Bureau Monitoring Dashboard & Bottleneck Analytics | 2/2 | ✅ Completed |
| **Phase 7** | Validated CSV Batch Ingestion Pipeline & Role-Scoped Export Engine | 2/2 | ✅ Completed |
| **Phase 8** | Explainable AI Intelligence (TF-IDF Duplicate Detection & Smart Routing Heuristics) | 0/2 | ⏳ Next |

**Overall Progress**: **14 of 16 Plans Completed (87.5%)**

---

## 🔐 Role-Based Access Control Matrix

| Capability | Platform Administrator (`ADMIN`) | Central Supervisor (`SUPERVISOR`) | Bureau Case Officer (`OFFICER`) | Read-Only Auditor (`AUDITOR`) |
|---|:---:|:---:|:---:|:---:|
| **Cross-Bureau Case Visibility** | Full | Full | Scoped to Assigned Bureau | Full Scoped Read |
| **Case Status Transitions** | Allowed | Allowed | Allowed (Own Bureau) | ❌ Forbidden |
| **Reassign Bureau / Officer** | Allowed | Allowed | Allowed (Own Bureau) | ❌ Forbidden |
| **Escalate Stalled Cases** | Allowed | Allowed | ❌ Forbidden | ❌ Forbidden |
| **Create Internal Notes** | Allowed | Allowed | Allowed | ❌ Forbidden |
| **View Confidential Complainant Statements** | Allowed | Allowed | Allowed | 🔒 Server-Redacted |
| **View Immutable Audit Timeline** | Full | Full | Full | Full |

---

## 🛡️ Zero-Fabrication & Ethical Compliance
- **100% Synthetic Data**: Zero actual student or complainant personal data used. All names, emails, and phone numbers are generated purely for demonstration.
- **Configurable Organizational Hierarchy**: Prevents inventing official statutory deadlines or non-public internal AICTE cell hierarchies.
- **Explainable Intelligence Boundary**: Recommender tools remain strictly advisory with human-in-the-loop sign-off; no autonomous disciplinary decisions.
