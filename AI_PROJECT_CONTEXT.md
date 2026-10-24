# AICTE Centralized Grievance Redressal & Institutional Case Surveillance System
## Comprehensive Architecture, Domain Specification & Implementation Dossier

> **Document Purpose**: This document is an exhaustive, self-contained system specification and architectural blueprint of the AICTE Grievance Portal. It is structured for ingestion by Large Language Models (LLMs) and autonomous AI coding agents to provide complete context regarding domain logic, database schemas, security guarantees, API surfaces, AI engines, and frontend presentation layers.

---

## 1. Executive Summary & Problem Context

- **Platform Name**: AICTE Integrated Grievance Redressal & Surveillance Platform
- **Objective**: Modernize, automate, and centralize complaint ingestion, jurisdiction-aware routing, deterministic lifecycle management, explainable AI-powered triage, SLA compliance surveillance, and whistleblower protection across all AICTE-approved technical institutions in India.
- **Key Beneficiaries**:
  - **Complainants**: Students, faculty members, institutional staff, and whistleblowers.
  - **AICTE Administrative Hierarchy**: Platform Administrators, Central Supervisors, Bureau Case Officers (Approval, Finance, Student Welfare, Faculty Grievance), and Independent Read-Only Auditors.

---

## 2. Technology Stack & Runtime Infrastructure

### Backend
- **Framework**: FastAPI (Python 3.11+) with asynchronous execution and Pydantic v2 schemas.
- **Relational ORM**: SQLAlchemy 2.0 with PostgreSQL database engine.
- **Production Database**: Supabase PostgreSQL with pooled connection handling and automated foreign key cascades; local SQLite fallback for isolated testing.
- **Authentication & Cryptography**:
  - Stateless JWT (JSON Web Tokens) signed via HMAC-SHA256 with standard claims (`sub`, `email`, `role`, `bureau_id`, `exp`).
  - Passwords hashed using salted PBKDF2 / Bcrypt.
  - Complainant PII encrypted at rest; tokens hashed via SHA-256 for cryptographic challenge verification.
- **Vector & AI Processing**:
  - **Dense Semantic Embeddings**: Fastembed ONNX runtime (`BAAI/bge-small-en-v1.5`, 384-dimensional dense semantic vectors) requiring zero heavy PyTorch or GPU overhead.
  - **Persistent Vector Store**: `PersistentVectorStore` persisting normalized dense vectors and case metadata to disk (`.vector_store/case_embeddings.npy` and `case_metadata.json`), with atomic incremental additions and `<10ms` boot reload surviving server restarts.
  - **Calibrated Multi-Tier Similarity**: Calibrated threshold benchmarks (`0.78` High-Confidence Duplicate, `0.65` Thematically Related Cluster) paired with domain-specific boilerplate stopword pruning (`AICTE`, `college`, `institution`, `complaint`, `grievance`) preventing false-positive flood cascades.
  - **ML Zero-Shot Statutory Triage**: `SemanticZeroShotTriageClassifier` projecting incoming freeform complaints against statutory bureau archetypes (`APPR`, `FIN`, `STU`, `FDC`) with automated safety hazard detection (`URGENT` priority for ragging, violence, or suicide threats) and transparent explainability rationale cards.

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Styling Architecture**: Custom CSS Design System using modern CSS variables, glassmorphic panels (`rgba(18, 28, 56, 0.8)`), dark mode contrast, responsive layouts, and zero heavy external UI libraries.
- **Iconography & Fonts**: `lucide-react` with Google Fonts (`Outfit` / `Inter` / Mono).
- **Session & State Management**: Custom `AuthContext` supporting live JWT persistence, dynamic user switching, and remount keying (`key={currentUser?.id}`).

---

## 3. Relational Database Schema & Domain Models

```
┌─────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│     Bureau      │1      *│       User       │1      *│  ComplaintCase   │
│  (Bureaus/Cells)├────────┤ (RBAC Hierarchy) ├────────┤(Core Dossier Rec)│
└────────┬────────┘        └──────────────────┘        └────────┬─────────┘
         │1                                                     │1
         │                                                      ├──────────────────┐*
         │*                                                     │1                 │
┌────────┴────────┐                                    ┌────────┴────────┐┌────────┴────────┐
│   Institution   │                                    │  TimelineEvent  ││    CaseNote     │
│(AICTE Reg Inst) │                                    │(Immutable Audit)││(Confidential DB)│
└─────────────────┘                                    └─────────────────┘└─────────────────┘
                                                                │1                 │1
                                                                ├──────────────────┘*
                                                                │1
                                                       ┌────────┴────────┐
                                                       │ CaseAttachment  │
                                                       │(Scanned Evidence│
                                                       └─────────────────┘
```

### Table 1: `bureaus`
- `id` (UUID PK): Unique identifier.
- `code` (VARCHAR(16), Unique): AICTE bureau code, e.g., `APPR` (Approval), `FIN` (Finance), `STU` (Student Welfare), `FDC` (Faculty Development & Grievance).
- `name` (VARCHAR(128)): Human-readable bureau name.
- `description` (TEXT): Procedural jurisdiction summary.
- `is_active` (BOOLEAN): Soft-activation toggle.

### Table 2: `institutions`
- `id` (UUID PK): Unique identifier.
- `aicte_permanent_id` (VARCHAR(32), Unique): Official AICTE Institutional Code (e.g., `1-10992381`).
- `name` (VARCHAR(255)): College / University name.
- `state` (VARCHAR(64)), `district` (VARCHAR(64)): Regional jurisdiction.
- `institution_type` (VARCHAR(64)): Private, Government, Autonomous, Deemed University.

### Table 3: `users`
- `id` (UUID PK): Unique identifier.
- `email` (VARCHAR(128), Unique): Official `.gov.in` address.
- `full_name` (VARCHAR(128)): Officer / Auditor name.
- `hashed_password` (VARCHAR(255)): Salted password hash.
- `role` (ENUM: `ADMIN`, `SUPERVISOR`, `OFFICER`, `AUDITOR`).
- `bureau_id` (UUID FK -> `bureaus.id`, Nullable): Assigned cell (null for Universal Admin & Supervisor).
- `is_active` (BOOLEAN): Active status indicator.

### Table 4: `complaint_cases`
- `id` (UUID PK): Internal database key.
- `case_reference_id` (VARCHAR(32), Unique): Deterministic public reference format (e.g., `AICTE-2026-APPR-001`).
- `institution_id` (UUID FK -> `institutions.id`): Accused / subject institution.
- `bureau_id` (UUID FK -> `bureaus.id`): Active assigned AICTE cell.
- `assigned_officer_id` (UUID FK -> `users.id`, Nullable): Case officer handling inquiry.
- `subject` (VARCHAR(255)): Grievance headline.
- `description_redacted` (TEXT): Sanitized public/auditor safe summary.
- `description_confidential` (TEXT, Nullable): Privileged evidence and allegations.
- `category` (VARCHAR(64)): Fee extortion, ragging, harassment, faculty salary non-payment, unapproved course, etc.
- `priority` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- `status` (ENUM: `Received`, `Registered`, `Under Triage`, `Assigned`, `In Progress`, `Awaiting Information`, `Under Review`, `Resolved`, `Closed`).
- `complainant_identity_id` (UUID FK -> `complainant_identities.id`, Nullable): Encrypted e-KYC vault link.
- `due_date` (TIMESTAMPTZ): SLA completion target date.
- `escalation_level` (INT): `0` = Normal, `1` = Approaching, `2` = Overdue breach.
- `closure_remarks` (TEXT, Nullable): Final disposal order.
- `created_at`, `updated_at` (TIMESTAMPTZ).

### Table 5: `timeline_events` (Immutable Audit Trail)
- `id` (UUID PK): Unique event log record.
- `case_id` (UUID FK -> `complaint_cases.id`): Target complaint.
- `actor_id` (UUID FK -> `users.id`, Nullable): Officer or System engine performing action.
- `actor_role` (VARCHAR(32)): Snapshot of role at transaction time.
- `event_type` (ENUM: `CREATED`, `TRANSITION`, `ASSIGNED`, `REASSIGNED`, `NOTE_ADDED`, `EVIDENCE_UPLOADED`, `ESCALATED`, `REOPENED`, `TRIAGE_APPLIED`).
- `previous_state` (VARCHAR(64), Nullable): State before transition.
- `new_state` (VARCHAR(64), Nullable): Resulting state.
- `metadata_json` (JSONB): Granular contextual parameters (reasons, remarks, hashes).
- `timestamp` (TIMESTAMPTZ): Append-only creation time.

### Table 6: `case_notes`
- `id` (UUID PK): Unique note record.
- `case_id` (UUID FK -> `complaint_cases.id`): Parent case.
- `author_id` (UUID FK -> `users.id`): Note creator.
- `content` (TEXT): Factual investigative finding or directive.
- `is_confidential` (BOOLEAN): If true, strictly hidden from Read-Only Auditor role.
- `created_at` (TIMESTAMPTZ).

### Table 7: `case_attachments` (Evidentiary Vault)
- `id` (UUID PK): Unique attachment record.
- `case_id` (UUID FK -> `complaint_cases.id`): Associated case.
- `uploader_id` (UUID FK -> `users.id`): Officer uploading proof.
- `file_name` (VARCHAR(255)): Original document name.
- `file_path` (VARCHAR(512)): Secure storage path.
- `file_size_bytes` (BIGINT): File byte length.
- `mime_type` (VARCHAR(64)): Enforced MIME validation (PDF, JPEG, PNG, DOCX).
- `sha256_hash` (VARCHAR(64)): Cryptographic content checksum for tamper detection.
- `category` (ENUM: `EVIDENCE`, `INSTITUTIONAL_RESPONSE`, `INQUIRY_REPORT`, `AFFIDAVIT`, `OTHER`).
- `antivirus_scan_status` (VARCHAR(32)): `CLEAN`, `SUSPICIOUS`, `PENDING`.
- `is_confidential` (BOOLEAN): Confidentiality mask toggle.
- `created_at` (TIMESTAMPTZ).

### Table 8: `complainant_identities` (Whistleblower & e-KYC Vault)
- `id` (UUID PK): Anonymous link key.
- `full_name_encrypted` (VARCHAR(255)): Encrypted citizen name.
- `identifier_encrypted` (VARCHAR(255)): Encrypted Mobile / Email / Aadhaar Virtual ID.
- `masked_identifier` (VARCHAR(64)): Anonymized display string (e.g., `+91-XXXXX-98210` or `r****@domain.com`).
- `complainant_type` (ENUM: `STUDENT`, `FACULTY`, `PARENT`, `CITIZEN`, `WHISTLEBLOWER`).
- `verification_method` (ENUM: `OTP_SMS`, `OTP_EMAIL`, `DIGILOCKER`, `AADHAAR_XML`).
- `is_verified` (BOOLEAN): Verification status.
- `verification_token_hash` (VARCHAR(64)): Cryptographic verification challenge hash.
- `verified_at` (TIMESTAMPTZ).

---

## 4. Deterministic 9-Stage Case Lifecycle & Guard Enforcement

The state machine implements rigid procedural validity checks. Illegal jumps (such as moving directly from `Registered` to `Resolved` without investigation) throw `HTTP 422 Unprocessable Entity` with automated rollback:

```
[ Received ] ────────► [ Registered ] ────────► [ Under Triage ]
                                                       │
                                                       ▼
[ In Progress ] ◄─────── [ Assigned ] ◄────────────────┘
       │ ▲
       │ └────────────────────────────┐
       ▼                              │
[ Awaiting Information ]              │
       │                              │
       ▼                              │
[ Under Review ]                      │
       │                              │
       ▼                              │
  [ Resolved ] ───────────────────────┤ (Formal Appeal / Reopen)
       │                              │
       ▼                              │
   [ Closed ] ────────────────────────┘
```

### Valid Transition Matrix
1. **Received** $\rightarrow$ Registered
2. **Registered** $\rightarrow$ Under Triage, Closed (if malformed)
3. **Under Triage** $\rightarrow$ Assigned, Registered (re-evaluate)
4. **Assigned** $\rightarrow$ In Progress, Under Triage
5. **In Progress** $\rightarrow$ Awaiting Information, Under Review, Resolved
6. **Awaiting Information** $\rightarrow$ In Progress, Under Review
7. **Under Review** $\rightarrow$ In Progress, Resolved
8. **Resolved** $\rightarrow$ Closed, In Progress (Reopened via formal justification)
9. **Closed** $\rightarrow$ In Progress (Supervisory appeal with logged reason)

---

## 5. Server-Side Security, RBAC & Jurisdictional Protection

| User Role | Permitted Scope | PII Complainant Exposure | Case Actions Permitted | Confidential Notes |
|---|---|---|---|---|
| **ADMIN** | Universal (All 4 Bureaus) | Full Access (Logged) | Ingest, Assign, Transition, Configure | Readable & Writable |
| **SUPERVISOR** | Universal (All 4 Bureaus) | Full Access (Logged) | Reassign, Escalate, Transition, Audit | Readable & Writable |
| **OFFICER** | Scoped strictly to `user.bureau_id` | Full Access (Within Bureau) | Investigation, State Advance, Uploads | Readable & Writable |
| **AUDITOR** | Universal Read-Only | **Redacted / Masked** | Read Only (No Transitions/Notes) | **Hidden / Filtered** |

### Security Guarantees:
1. **Insecure Direct Object Reference (IDOR) Protection**:
   An Approval Bureau Officer attempting to view `GET /api/v1/cases/AICTE-2026-FIN-004` (Finance Bureau) receives `HTTP 403 Forbidden` (`INSUFFICIENT_BUREAU_PERMISSIONS`).
2. **PII Masking**:
   Read-Only Auditor requests to `/api/v1/cases` automatically scrub `description_confidential` and mask identifiers.
3. **Append-Only Auditing**:
   No event in `timeline_events` can be updated or deleted via API.

---

## 6. AI Intelligence & Automated Decision Support Engines

### 1. Vector Space Duplicate Detection Engine
- **Vector Algorithm**: In-memory TF-IDF n-gram vectorization with cosine similarity scoring.
- **Latency**: Sub-2ms execution across active case repositories.
- **Features**:
  - Checks incoming complaint against registered cases in the same institution.
  - Computes similarity score ($0.0 \rightarrow 1.0$). If $\text{score} \ge 0.35$, alerts officer with duplicate match flag, matching reference ID, and matched text snippet.

### 2. Explainable Triage & Bureau Routing Engine
- **Endpoint**: `POST /api/v1/ai/triage/suggest`
- **Output Structure**:
  - `recommended_bureau_code`: Best target bureau (e.g., `APPR`, `FIN`, `STU`, `FDC`).
  - `recommended_priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `confidence_score`: Normalized certainty metric ($0.0 \rightarrow 1.0$).
  - `reasoning_factors`: List of explainable contributing tokens (e.g., `"Detected high-frequency financial terms: capitation fee, extortion, receipt withholding"`).
  - `keyword_matches`: Identified domain anchors.
- **Auto-Apply Mechanism**: `POST /api/v1/ai/triage/apply` allows one-click execution to atomically update bureau, priority, and status with an automated audit log entry.

### 3. SLA Aging Surveillance Radar
- **Classification**:
  - **On Track**: $> 48\text{ hours}$ remaining until SLA target.
  - **Approaching**: $\le 48\text{ hours}$ remaining until deadline.
  - **Overdue Breach**: Target deadline elapsed ($\le 0\text{ hours}$).
- **Surveillance Endpoint**: `GET /api/v1/cases/sla/radar` returns categorized counts, sorted critical lists, and automatic escalation recommendations.

### 4. Lifecycle Dwell-Time & Bottleneck Detection Engine
- **Calculation**: Computes mean hours elapsed per lifecycle state across closed and open cases.
- **Output**: Identifies the primary drag point (e.g., `"Under Review"` stage with $124.5\text{ hours}$ mean dwell time) to alert central supervisors of administrative stagnation before SLA breach occurs.

---

## 7. Bulk Data Ingestion & Role-Scoped Export Pipeline

### CSV Ingestion (`/api/v1/cases/import/preview` & `/commit`)
- **Pre-Validation**: RFC 4180 parsing with multi-pass schema validation.
- **Validation Gates**:
  1. Header conformity (`subject`, `institution_code`, `category`, `priority`, `complainant_type`, etc.).
  2. Institution existence validation against database AICTE permanent IDs.
  3. Priority and category enumeration normalization.
  4. Duplicate detection preview against existing database complaints.
- **Atomic Batch Commit**: Database transaction ensures all valid rows are inserted in a single commit, returning granular success/failure logs per row index.

### CSV Export (`/api/v1/cases/export/csv`)
- Exports filtered catalog matching currently active search and status parameters.
- Formatted as clean RFC 4180 CSV with automatic PII sanitization for Auditor requests.

---

## 8. AI Intelligence: Persistent Semantic Vectors & Zero-Shot Triage Engine

The AI subsystem addresses four critical production challenges in public grievance systems:

### 1. Persistent Dense Vector Store (`PersistentVectorStore`)
- **Problem Solved**: Ephemeral in-memory caches lose state upon server restart or pod rescheduling, forcing expensive full re-vectorization on cold start.
- **Implementation**: Utilizes `fastembed` with ONNX runtime (`BAAI/bge-small-en-v1.5`, 384-dimensional dense semantic vectors). Normalized embeddings and metadata persist atomically to disk in `.vector_store/case_embeddings.npy` and `case_metadata.json`.
- **Performance**: Loads precomputed indices in `<10ms` on startup. Incrementally updates with each new complaint in `~15ms`.

### 2. Semantic Synonym Understanding (Beyond Lexical TF-IDF)
- **Problem Solved**: Lexical keyword matching fails when citizens and authorities describe identical grievances with disparate vocabulary. For example, *"the college stole my money"* and *"unauthorized fee extortion"* share zero words under TF-IDF, scoring 0.0 similarity.
- **Implementation**: Dense semantic vectors map both expressions to adjacent positions in embedding space, yielding a strong cosine similarity of `0.6636` without requiring exact word matches.

### 3. Calibrated Multi-Tier Thresholds & Boilerplate Pruning
- **Problem Solved**: Generic boilerplate greetings (*"Respected AICTE Sir, grievance regarding institution..."*) artificially inflate similarity and flood officers with false positives if thresholds are uncalibrated (e.g. at 0.35).
- **Implementation**:
  - **Domain Stopword Filtering**: Strips generic institutional tokens (`aicte`, `institution`, `college`, `university`, `complaint`, `grievance`, `sir`, `madam`, etc.) before vectorization.
  - **Calibrated Multi-Tier Thresholds**:
    - `0.78`: High-Confidence Duplicate (Flagged with critical review banner).
    - `0.65`: Thematically Related Cluster (Flagged as relevant matter).
    - `< 0.65`: Distinct complaints (Filtered out to protect officer cognitive bandwidth).

### 4. Zero-Shot Statutory Bureau Classification (`SemanticZeroShotTriageClassifier`)
- **Problem Solved**: Hardcoded regex patterns and fragile keyword rules cannot adapt to freeform, unpredictable public complaints.
- **Implementation**: Defines dense statutory archetype vectors for all four AICTE operational bureaus:
  - **Approval Bureau (`APPR`)**: Unapproved courses, affiliation fraud, infrastructure deficits.
  - **Finance Bureau (`FIN`)**: Capitation fees, extortion, caution deposit withholding, fee hikes.
  - **Student Welfare Cell (`STU`)**: Anti-ragging compliance, harassment, mental distress, violence.
  - **Faculty Grievance Cell (`FDC`)**: 7th CPC salary non-payment, staff exploitation, withheld PF.
- **Safety Hazard Detection**: Automated trigger detecting violence, ragging, or suicide threats, elevating priority immediately to `URGENT`.
- **Explainability**: Outputs structured evidence cards showing exact cosine proximity, domain policy basis, and institutional history precedent.

---

## 9. Complete API Endpoint Catalog (FastAPI v1)

| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Service and database connectivity health probe | Public |
| `POST` | `/api/v1/auth/login` | Authenticate email/password, returning signed JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user profile, permissions, and jurisdiction | JWT Bearer |
| `GET` | `/api/v1/auth/switch-demo-role/{role}` | Instant role switch token generator for evaluation | JWT Bearer |
| `GET` | `/api/v1/bureaus` | List all registered AICTE bureaus | JWT Bearer |
| `GET` | `/api/v1/bureaus/{id}/officers` | List assigned officers in a specific bureau | JWT Bearer |
| `GET` | `/api/v1/cases` | Paginated, filterable, sortable complaint register | JWT Bearer |
| `GET` | `/api/v1/cases/{case_ref}` | Detailed dossier with timeline and verification badge | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/transition` | Advance case lifecycle state with mandatory remarks | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/reopen` | Reopen resolved case with formal justification | JWT Bearer |
| `GET` | `/api/v1/cases/{case_ref}/timeline` | Retrieve immutable append-only audit trail | JWT Bearer |
| `GET` | `/api/v1/cases/{case_ref}/notes` | List internal investigative notes (confidential masked) | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/notes` | Create internal note (emits `NOTE_ADDED` audit event) | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/assign` | Reassign case bureau or officer with recorded rationale | JWT Bearer |
| `GET` | `/api/v1/cases/{case_ref}/assignment-history` | Full transfer and delegation history | JWT Bearer |
| `GET` | `/api/v1/cases/sla/radar` | Real-time SLA aging risk summary and breach lists | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/escalate` | Escalate case surveillance tier with justification | JWT Bearer |
| `POST` | `/api/v1/cases/import/preview` | Multipart/JSON CSV pre-validation and error preview | JWT Bearer |
| `POST` | `/api/v1/cases/import/commit` | Atomic transactional insertion of validated CSV rows | JWT Bearer |
| `GET` | `/api/v1/cases/export/csv` | Download role-sanitized RFC 4180 CSV export | JWT Bearer |
| `GET` | `/api/v1/cases/{case_ref}/attachments`| List evidentiary file records with hashes and scan status| JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/attachments`| Upload proof document with MIME check & SHA-256 | JWT Bearer |
| `POST` | `/api/v1/identity/otp/send` | Send sandbox verification challenge to complainant | Public / Officer |
| `POST` | `/api/v1/identity/otp/verify` | Verify OTP code and issue cryptographically masked token | Public / Officer |
| `POST` | `/api/v1/ai/duplicates/check` | Analyze text payload for duplicates against case base | JWT Bearer |
| `GET` | `/api/v1/ai/duplicates/{case_ref}` | Query duplicates matching an existing case dossier | JWT Bearer |
| `POST` | `/api/v1/ai/triage/suggest` | Generate explainable bureau routing & priority suggestion| JWT Bearer |
| `GET` | `/api/v1/ai/triage/suggest/{case_ref}`| Generate triage proposal for an existing case dossier | JWT Bearer |
| `POST` | `/api/v1/ai/triage/apply` | Apply triage proposal directly to case in database | JWT Bearer |
| `GET` | `/api/v1/dashboard/metrics` | Executive KPI cards and categorical breakdowns | JWT Bearer |
| `GET` | `/api/v1/dashboard/bottlenecks` | Lifecycle dwell-time latency and bottleneck stage | JWT Bearer |
| `GET` | `/api/v1/dashboard/workload` | Non-toxic cross-bureau volume & throughput metrics | JWT Bearer |

---

## 10. Standard Demo User Credentials (Password: `Admin@123`)

| Full Name | Role | Email | Jurisdiction / Bureau |
|---|---|---|---|
| **Smt. Sunita Sharma** | `ADMIN` | `admin@aicte-demo.gov.in` | Universal Platform Administration (All Bureaus) |
| **Dr. Ramesh Chandra** | `SUPERVISOR` | `supervisor@aicte-demo.gov.in` | Universal Cross-Bureau Case Oversight & Escalations |
| **Shri Arvind Verma** | `OFFICER` | `officer.appr@aicte-demo.gov.in` | Scoped to **Approval Bureau** (`APPR`) |
| **Shri Deepesh Goyal** | `OFFICER` | `officer.fin@aicte-demo.gov.in` | Scoped to **Finance Bureau** (`FIN`) |
| **Dr. Priya Nair** | `OFFICER` | `officer.stu@aicte-demo.gov.in` | Scoped to **Student Welfare Cell** (`STU`) |
| **Prof. Manoj Joshi** | `OFFICER` | `officer.fdc@aicte-demo.gov.in` | Scoped to **Faculty Grievance Cell** (`FDC`) |
| **CA Ananya Iyer** | `AUDITOR` | `auditor@aicte-demo.gov.in` | Universal Read-Only Inspection (PII Redacted) |

---

## 11. Local Development & Operational Verification

### Quick Start Commands

```powershell
# 1. Start Backend API Server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload

# 2. Start Frontend Dev Server
npm --prefix frontend run dev

# 3. Production Build Validation
npm --prefix frontend run build
```

### URLs
- **Web Portal**: [http://localhost:5173/](http://localhost:5173/)
- **Swagger / OpenAPI Documentation**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- **Health Probe**: [http://127.0.0.1:8001/api/v1/health](http://127.0.0.1:8001/api/v1/health)
- **GitHub Repository**: [https://github.com/kartikayrwt07/SIH-PROTOTYPE.git](https://github.com/kartikayrwt07/SIH-PROTOTYPE.git)
