# AICTE Centralized Grievance Redressal & Institutional Case Surveillance System
## Comprehensive Architecture, Domain Specification & Implementation Dossier

> **Document Purpose**: This document is an exhaustive, self-contained system specification and architectural blueprint of the AICTE Grievance Portal. It is structured for ingestion by Large Language Models (LLMs) and autonomous AI coding agents to provide complete context regarding domain logic, database schemas, security guarantees, API surfaces, AI engines, and frontend presentation layers.

---

## 1. Executive Summary & Problem Context

- **Platform Name**: AICTE Integrated Grievance Redressal & Institutional Case Surveillance Platform
- **Objective**: Modernize, automate, and centralize complaint ingestion, jurisdiction-aware routing, deterministic lifecycle management, explainable AI-powered triage, SLA compliance surveillance, systemic duplicate grouping (Master Tickets), zero-login student status tracking via Telegram, dynamic college credit scoring, and whistleblower protection across all AICTE-approved technical institutions in India.
- **Key Beneficiaries**:
  - **Complainants**: Students, faculty members, institutional staff, parents, and whistleblowers.
  - **AICTE Administrative Hierarchy**: Platform Administrators, Central Supervisors, Bureau Case Officers (Approval, Finance, Student Welfare, Faculty Grievance), and Independent Read-Only Auditors.
  - **Institutional Leadership**: College Principals, Registrars, and Deans held accountable through dynamic Trust Scores.

---

## 2. Technology Stack & Runtime Infrastructure

### Backend
- **Framework**: FastAPI (Python 3.11+) with asynchronous execution, CORS middleware, and Pydantic v2 validation schemas.
- **Relational ORM**: SQLAlchemy 2.0 with PostgreSQL database engine.
- **Production Database**: Supabase PostgreSQL with pooled connection handling and automated foreign key cascades; local SQLite fallback for isolated testing and development.
- **Authentication & Cryptography**:
  - Stateless JWT (JSON Web Tokens) signed via HMAC-SHA256 with standard claims (`sub`, `email`, `role`, `bureau_id`, `exp`).
  - Passwords hashed using salted PBKDF2 / Bcrypt.
  - Complainant PII encrypted at rest; tokens hashed via SHA-256 for cryptographic challenge verification.
- **Vector & AI Processing**:
  - **Dense Semantic Embeddings**: Fastembed ONNX runtime (`BAAI/bge-small-en-v1.5`, 384-dimensional dense semantic vectors) requiring zero heavy PyTorch or GPU overhead.
  - **Persistent Vector Store (Supabase pgvector)**: `PersistentVectorStore` persisting normalized dense vectors and case metadata directly inside Supabase's native PostgreSQL `pgvector` extension (`case_embeddings` table with `Vector(384)` and HNSW indexing), completely immune to ephemeral filesystem wipes across cloud server restarts or container deploys (Render, Heroku, AWS ECS).
  - **Calibrated Multi-Tier Similarity**: Calibrated threshold benchmarks (`0.78` High-Confidence Duplicate, `0.65` Thematically Related Cluster) paired with domain-specific boilerplate stopword pruning (`AICTE`, `college`, `institution`, `complaint`, `grievance`) preventing false-positive flood cascades.
  - **ML Zero-Shot Statutory Triage**: `SemanticZeroShotTriageClassifier` projecting incoming freeform complaints against statutory bureau archetypes (`APPR`, `FIN`, `STU`, `FDC`) with automated safety hazard detection (`URGENT` priority for ragging, violence, or suicide threats) and transparent explainability rationale cards.
- **Master Ticket System**: Automated cluster aggregation engine (`duplicate_grouping.py`) grouping related grievances per institution, enabling 1-click administrative bulk cascading resolution to all child cases.
- **Telegram Bot Webhook Engine**: Python async service (`telegram_bot.py` & `telegram_poller.py`) integrating official `@aictesih_bot` for instant zero-login case and master ticket status lookup with PII redaction.
- **Dynamic Institution Trust Engine**: Live compliance credit scoring algorithm (`institution_trust.py`) computing a 1,000-point institutional credit score based on active SLA breaches, verified critical complaints, and repeat systemic clusters.

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Styling Architecture**: Custom CSS Design System using modern CSS variables, glassmorphic panels (`rgba(18, 28, 56, 0.8)`), dark mode contrast, responsive layouts, and zero heavy external UI libraries.
- **Iconography & Fonts**: `lucide-react` with Google Fonts (`Outfit` / `Inter` / Mono).
- **Session & State Management**: Custom `AuthContext` supporting live JWT persistence, dynamic user switching, and remount keying (`key={currentUser?.id}`).
- **Key Administrative Views**:
  - `ExecutiveDashboard.tsx`: KPI ribbon, SLA risk radar, lifecycle dwell-time bottleneck analytics, with dynamic dual-filter support (Bureau scoping + Individual College scoping with dedicated College Health Card).
  - `MasterTicketHub.tsx`: Visual interface for systemic cluster detection, child grievance grouping, and bulk cascading resolution.
  - `InstitutionTrustLeaderboard.tsx`: Super Admin college credit score leaderboard (AAA to C Red Zone) with penalty deduction breakdown and automated regulatory sanctions.
  - `SmartTriageView.tsx`: Operational intake queue with real-time KPI metrics (Intake Queue, Pending Routing, Urgent/High SLA, AI Vector Engine latency), dark glassmorphic layout, explainable zero-shot bureau suggestions with keyword rationales, adjustable similarity sensitivity toggle (60%, 65%, 75%), side-by-side duplicate comparison modal, and 1-click Human-in-the-Loop dispatch gate.
  - `MagicIntakeView.tsx`: AI-assisted ingestion workbench with automatic translation and entity extraction.

---

## 3. Relational Database Schema & Domain Models

```
┌─────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│     Bureau      │1      *│       User       │1      *│  ComplaintCase   │
│  (Bureaus/Cells)├────────┤ (RBAC Hierarchy) ├────────┤(Core Dossier Rec)│
└────────┬────────┘        └──────────────────┘        └────────┬─────────┘
         │1                                                     │1        │*
         │                                                      │         │
         │*                                                     │         │  ┌──────────────────┐
┌────────┴────────┐                                             │         └──┤   MasterTicket   │
│   Institution   │                                             │            │(Cluster Parent)  │
│(AICTE Reg Inst) │                                             │            └────────┬─────────┘
└────────┬────────┘                                             │                     │1
         │1                                                     │                     │*
         │                                             ┌────────┴────────┐   ┌────────┴────────┐
         │*                                            │  TimelineEvent  │   │MasterTicketChild│
┌────────┴────────┐                                    │(Immutable Audit)│   │ (Cluster Link)  │
│  ComplaintCase  │                                    └─────────────────┘   └─────────────────┘
└─────────────────┘                                             │1
                                                                ├──────────────────┐*
                                                                │1                 │
                                                       ┌────────┴────────┐┌────────┴────────┐
                                                       │ CaseAttachment  ││    CaseNote     │
                                                       │(Scanned Evidence││(Confidential DB)│
                                                       └─────────────────┘└─────────────────┘
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
- `is_active` (BOOLEAN): Active operational status.
- `created_at` (TIMESTAMPTZ).

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
- `status` (ENUM: `Received`, `Registered`, `Under Triage`, `Assigned`, `In Progress`, `Awaiting Information`, `Under Review`, `Resolved`, `Closed`, `Rejected`).
- `complainant_identity_id` (UUID FK -> `complainant_identities.id`, Nullable): Encrypted e-KYC vault link.
- `master_ticket_id` (UUID FK -> `master_tickets.id`, Nullable): Affiliated systemic Master Ticket parent.
- `due_date` (TIMESTAMPTZ): SLA completion target date.
- `escalation_level` (INT): `0` = Normal, `1` = Approaching, `2` = Overdue breach.
- `closure_remarks` (TEXT, Nullable): Final disposal order.
- `created_at`, `updated_at` (TIMESTAMPTZ).

### Table 5: `master_tickets` (Systemic Cluster Parent)
- `id` (UUID PK): Unique master ticket key.
- `ticket_reference_id` (VARCHAR(50), Unique): Public cluster ID (e.g., `MT-2026-X8F2Q`).
- `institution_id` (UUID FK -> `institutions.id`): Associated institution.
- `bureau_id` (UUID FK -> `bureaus.id`): Handling bureau.
- `assigned_officer_id` (UUID FK -> `users.id`, Nullable): Lead investigating officer.
- `consolidated_subject` (VARCHAR(500)): Synthetic summary of common complaint theme.
- `consolidated_description` (TEXT): Aggregated complaint facts and student grievances.
- `category` (VARCHAR(100)): Grievance category.
- `common_grievance_theme` (VARCHAR(255)): Concise theme title (e.g., "Hostel Water Contamination").
- `child_count` (INT): Total number of linked individual complaints.
- `similarity_threshold` (FLOAT): Cosine threshold used for group construction (default: 0.78).
- `avg_similarity_score` (FLOAT): Mean cosine confidence across all child cases.
- `status` (ENUM: `Open`, `In Progress`, `Resolved`, `Closed`).
- `resolution_remarks` (TEXT, Nullable): Official resolution order applied to all children.
- `time_saved_hours` (FLOAT): Estimated administrative processing hours saved (child_count * 1.5h).
- `created_at`, `updated_at`, `resolved_at` (TIMESTAMPTZ).

### Table 6: `master_ticket_children` (M:N Cluster Affiliation)
- `id` (UUID PK): Link record identifier.
- `master_ticket_id` (UUID FK -> `master_tickets.id`): Parent cluster.
- `case_id` (UUID FK -> `complaint_cases.id`): Linked child complaint.
- `similarity_score` (FLOAT): Exact cosine distance of this child complaint to the cluster anchor.
- `is_anchor` (BOOLEAN): True for the initial/representative case that formed the cluster.
- `linked_at` (TIMESTAMPTZ).

### Table 7: `timeline_events` (Immutable Audit Trail)
- `id` (UUID PK): Unique event log record.
- `case_id` (UUID FK -> `complaint_cases.id`): Target complaint.
- `actor_id` (UUID FK -> `users.id`, Nullable): Officer or System engine performing action.
- `actor_role` (VARCHAR(32)): Snapshot of role at transaction time.
- `event_type` (ENUM: `CREATED`, `TRANSITION`, `ASSIGNED`, `REASSIGNED`, `NOTE_ADDED`, `EVIDENCE_UPLOADED`, `ESCALATED`, `REOPENED`, `TRIAGE_APPLIED`, `MASTER_TICKET_LINKED`, `MASTER_TICKET_RESOLVED`).
- `previous_state` (VARCHAR(64), Nullable): State before transition.
- `new_state` (VARCHAR(64), Nullable): Resulting state.
- `metadata_json` (JSONB): Granular contextual parameters (reasons, remarks, hashes).
- `timestamp` (TIMESTAMPTZ): Append-only creation time.

### Table 8: `case_notes`
- `id` (UUID PK): Unique note record.
- `case_id` (UUID FK -> `complaint_cases.id`): Parent case.
- `author_id` (UUID FK -> `users.id`): Note creator.
- `content` (TEXT): Factual investigative finding or directive.
- `is_confidential` (BOOLEAN): If true, strictly hidden from Read-Only Auditor role.
- `created_at` (TIMESTAMPTZ).

### Table 9: `case_attachments` (Evidentiary Vault)
- `id` (UUID PK): Unique attachment record.
- `case_id` (UUID FK -> `complaint_cases.id`): Associated case.
- `uploader_id` (UUID FK -> `users.id`): Officer uploading proof.
- `file_name` (VARCHAR(255)): Original document name.
- `file_size_bytes` (BIGINT): File byte length.
- `mime_type` (VARCHAR(64)): Enforced MIME validation (PDF, JPEG, PNG, WEBP, DOCX).
- `storage_path` (VARCHAR(500)): Object path within cloud bucket (`evidence/{case_ref}/{uuid}_{safe_name}`).
- `storage_bucket` (VARCHAR(100)): Target bucket (`aicte-case-evidence`).
- `storage_provider` (VARCHAR(50)): Active cloud provider (`supabase` / `s3`).
- `secure_url` (VARCHAR(1000)): Direct authenticated CDN or presigned object URL, eliminating ephemeral container disk reliance.
- `category` (ENUM: `FEE_RECEIPT`, `BANK_STATEMENT`, `AFFILIATION_DOCUMENT`, `FACILITY_PHOTOGRAPH`, `SALARY_SLIP`, `COMMUNICATION_RECORD`, `OTHER`).
- `scan_status` (ENUM: `CLEAN`, `INFECTED`, `PENDING`, `SKIPPED`): Antivirus / ClamAV verification audit.
- `sha256_hash` (VARCHAR(64)): Cryptographic content checksum for tamper detection.
- `is_confidential` (BOOLEAN): Confidentiality mask toggle.
- `created_at` (TIMESTAMPTZ).

### Table 10: `complainant_identities` (Whistleblower & e-KYC Vault)
- `id` (UUID PK): Anonymous link key.
- `full_name_encrypted` (VARCHAR(255)): Encrypted citizen name.
- `identifier_encrypted` (VARCHAR(255)): Encrypted Mobile / Email / Aadhaar Virtual ID.
- `masked_identifier` (VARCHAR(64)): Anonymized display string (e.g., `+91-XXXXX-98210` or `r****@domain.com`).
- `complainant_type` (ENUM: `STUDENT`, `FACULTY`, `PARENT`, `CITIZEN`, `WHISTLEBLOWER`).
- `verification_method` (ENUM: `OTP_SMS`, `OTP_EMAIL`, `DIGILOCKER`, `AADHAAR_XML`).
- `is_verified` (BOOLEAN): Verification status.
- `verification_token_hash` (VARCHAR(64)): Cryptographic verification challenge hash.
- `verified_at` (TIMESTAMPTZ).

### Table 11: `case_embeddings` (Supabase pgvector Store)
- `id` (UUID PK): Unique vector record key.
- `case_reference_id` (VARCHAR(50), Unique Index): Target complaint identifier.
- `embedding` (`VECTOR(384)`): 384-dimensional dense semantic vector from `BAAI/bge-small-en-v1.5`, indexed with PostgreSQL HNSW cosine distance (`vector_cosine_ops`).
- `subject` (VARCHAR(500)), `description` (TEXT): Denormalized text payload for ultra-fast single-scan retrieval.
- `institution_aicte_id` (VARCHAR(50)), `institution_name` (VARCHAR(200)): Regional and campus metadata.
- `bureau_code` (VARCHAR(20)), `bureau_name` (VARCHAR(100)): Jurisdictional routing labels.
- `status` (VARCHAR(50)): Real-time grievance status snapshot.
- `created_at`, `updated_at` (TIMESTAMPTZ).

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

    [ Rejected / Spam ] (Terminal - Segregated from MTTR & Resolution Rate)
```

### Valid Transition Matrix
1. **Received** $\rightarrow$ Registered, Rejected (instant rejection if malformed/bot payload)
2. **Registered** $\rightarrow$ Under Triage, Rejected (if malformed, spam, duplicate, or out-of-jurisdiction)
3. **Under Triage** $\rightarrow$ Assigned, Rejected (triage officer determines complaint is frivolous/spam)
4. **Assigned** $\rightarrow$ In Progress, Rejected
5. **In Progress** $\rightarrow$ Awaiting Information, Under Review, Rejected (investigation disproves claim as fraudulent)
6. **Awaiting Information** $\rightarrow$ In Progress, Rejected
7. **Under Review** $\rightarrow$ In Progress, Resolved, Rejected
8. **Resolved** $\rightarrow$ Closed, In Progress (Reopened via formal justification)
9. **Closed** $\rightarrow$ Terminal state for successfully resolved grievances
10. **Rejected** $\rightarrow$ Dedicated terminal state for malformed, spam, or non-AICTE claims

> **Architectural Guarantee Against Metrics Corruption**:
> Routing malformed or spam tickets to `Rejected` rather than `Closed` preserves the statistical integrity of executive KPIs:
> - **Average Resolution Time (MTTR)**: Calculated **strictly** on genuinely investigated and resolved grievances (`Resolved` / `Closed` with `resolved_at` timestamps). Zero-second bot rejections are isolated and cannot artificially deflate turnaround metrics.
> - **Resolution Rate %**: Computed against valid grievances (`Total - Rejected`), preventing spam waves from diluting institutional performance scores or inflating artificial closure counts.


---

## 5. Server-Side Security, RBAC & Jurisdictional Protection

| User Role | Permitted Scope | PII Complainant Exposure | Case Actions Permitted | Confidential Notes |
|---|---|---|---|---|
| **ADMIN** | Universal (All 4 Bureaus) | Full Access (Logged) | Ingest, Assign, Transition, Configure, Sanction | Readable & Writable |
| **SUPERVISOR** | Universal (All 4 Bureaus) | Full Access (Logged) | Reassign, Escalate, Transition, Audit, Trust Review | Readable & Writable |
| **OFFICER** | Scoped strictly to `user.bureau_id` | Full Access (Within Bureau) | Investigation, State Advance, Uploads, Master Ticket Link | Readable & Writable |
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

### 1. Persistent Dense Vector Store (`PersistentVectorStore` + Supabase `pgvector`)
- **Native Database Vector Engine**: Replaces ephemeral local disk files (`.npy`) with Supabase's native PostgreSQL `pgvector` extension and the `case_embeddings` table.
- **Ephemeral Filesystem Wipe Immunity**: When deployed on cloud containers (Render, Heroku, AWS ECS, Fly.io), vector state survives pod restarts, redeployments, and scale-to-zero cycles without loss.
- **Neural Architecture**: `fastembed` ONNX Runtime executing `BAAI/bge-small-en-v1.5` dense embeddings (384 dimensions).
- **Cold Boot Performance**: Precomputed vectors load straight from Supabase PostgreSQL in `<10ms`. Zero PyTorch or GPU server dependencies.
- **Normalization & HNSW Indexing**: Unit-normalized vectors indexed with native PostgreSQL HNSW cosine distance (`vector_cosine_ops`), supporting both sub-millisecond native SQL queries and in-memory dot-product evaluations.
- **Incremental Indexing**: Every new complaint is embedded and transactionally committed to `case_embeddings` in Supabase in `~15ms`.

### 2. Explainable Zero-Shot Statutory Bureau Triage
- **Algorithm**: Projects complaint vector against dense semantic archetypes representing the statutory mandate of each bureau:
  - **Approval Bureau (`APPR`)**: Unapproved courses, affiliation fraud, infrastructure deficits, laboratory deficiencies.
  - **Finance Bureau (`FIN`)**: Capitation fees, extortion, caution deposit withholding, arbitrary fee hikes.
  - **Student Welfare Cell (`STU`)**: Anti-ragging compliance, physical harassment, mental distress, POSH violations.
  - **Faculty Grievance Cell (`FDC`)**: 7th CPC salary non-payment, staff exploitation, withheld PF/gratuity.
- **Safety Hazard Detection**: Automated trigger detecting violence, ragging, or suicide threats, elevating priority immediately to `URGENT`.
- **Explainability**: Outputs structured evidence cards showing exact cosine proximity, domain policy basis, and contributing lexical tokens.

### 3. Smart Duplicate Grouping & Master Tickets (`duplicate_grouping.py`)
- **Systemic Problem Solved**: Resolves the "duplicate storm" during campus crises where dozens of students file identical complaints.
- **Threshold Calibration**:
  - `Cosine >= 0.78`: High-Confidence Duplicate.
  - `Cosine 0.65 - 0.77`: Thematically Related Cluster.
- **Boilerplate Pruning**: Filters out standard formal salutations and institutional stopwords before vector calculation.
- **Cascading Resolution Engine**:
  - When an officer marks a `MasterTicket` as `Resolved`, the system atomically transitions all linked child cases in `master_ticket_children` to `Resolved`.
  - Appends an automated audit event `MASTER_TICKET_RESOLVED` to each child ticket's timeline with the master resolution remarks.
  - Computes administrative hours saved (`child_count * 1.5 hours`).

### 4. Zero-Login Telegram Bot Tracker (`@aictesih_bot`)
- **Zero Friction Access**: Complainants text their Case Reference ID (`AICTE-2026-X9K2P`) or Master Ticket ID (`MT-XXXX`) to the Telegram bot and receive real-time case status without needing portal credentials.
- **Regex Query Extraction**: Intelligent parser matches case references embedded in natural language messages (e.g., *"What is the status of AICTE-2026-FIN-001?"*).
- **Redaction**: Complainant names, phone numbers, and confidential notes are strictly omitted from Telegram responses.
- **Live SLA Tracking**: Displays days remaining until statutory deadline or warning badge if overdue.

### 5. Dynamic Institution Trust Score Engine (College Credit Score out of 1000)
- **Baseline Score**: Every institution begins with a pristine score of **1,000 points (Tier AAA)**.
- **Penalty Ledger (Automated Deductions)**:
  - **Overdue SLA Deadline Breach**: `-45 points` per breach.
  - **Approaching SLA Warning (<48h)**: `-15 points` per pending case.
  - **Urgent Priority / Severe Grievance**: `-50 points` (e.g., safety hazards, ragging, POSH).
  - **High Priority Grievance**: `-30 points`.
  - **Sensitive Statutory AICTE Category**: `-35 points` (Capitation fees, illegal certificate retention, ghost faculty).
  - **Long-Dwell Backlog (>30 days unresolved)**: `-20 points`.
  - **Master Ticket Systemic Cluster**: `-60 points` per identified student cluster.
- **Recovery Incentives (Credits)**:
  - `+15 points` per resolved complaint within SLA.
  - `+40 points` bonus for maintaining $\ge 80\%$ institutional resolution rate.
  - `+30 points` clean streak bonus for zero active overdue breaches.
- **6-Tier Regulatory Action Matrix**:
  | Score Range | Grade | Risk Tier | Automated Regulatory Directive | Action Code |
  | :--- | :--- | :--- | :--- | :--- |
  | **850 – 1000** | **AAA** | Tier 1 (Exemplary Trust) | Eligible for fast-track autonomy & EOA auto-approval | `ROUTINE_COMPLIANCE` |
  | **700 – 849** | **AA** | Tier 2 (Good Standing) | Standard annual verification applies | `ROUTINE_COMPLIANCE` |
  | **550 – 699** | **A-** | Tier 3 (Moderate Scrutiny) | Mandatory quarterly ombudsman report submission | `HEIGHTENED_MONITORING` |
  | **400 – 549** | **BBB** | Tier 4 (Watchlist) | Formal AICTE advisory warning issued | `SHOW_CAUSE_SUMMONS` |
  | **250 – 399** | **B** | Tier 5 (High Risk) | Automated Show-Cause Notice issued to Governing Board | `SHOW_CAUSE_SUMMONS` |
  | **< 250** | **C** | Tier 6 (Critical Red Zone) | Mandatory On-Site Inspection & Academic Intake Freeze | `MANDATORY_INSPECTION_FREEZE` |
- **Regulatory Sanction Dispatch Engine (`POST /api/v1/institutions/{id}/action`)**:
  - **Schema Validation Resilience**: `RegulatoryActionRequest` features dynamic pre-validation aliasing accepting both `{ action_code, summary }` (frontend modal payload) and canonical `{ action_type, directive_notes }`, guaranteeing immunity against HTTP 422 Unprocessable Content.
  - **Comprehensive Action Support**: Full support for all modal directives: `SHOW_CAUSE_SUMMONS`, `MANDATORY_INSPECTION_FREEZE`, `HEIGHTENED_MONITORING`, `ROUTINE_COMPLIANCE`, as well as legacy `SHOW_CAUSE_NOTICE`, `FREEZE_INTAKE`, and `SCHEDULE_INSPECTION`.
  - **Statutory Audit Log Response**: Generates unique tracking UUID (`ACT-XXXXXXXX`), official AICTE docket reference (`AICTE/REG/YYYYMM/<aicte_id>`), formatted timestamp, and regulatory directive terms returned with dual-field compatibility (`dispatch_reference` & `reference_number`, `dispatched_at` & `issued_at`, `summary` & `message`).

### 6. Executive Dashboard & Real-Time Analytics
- **Dynamic Scoping**: Filter metrics nationally, by specific Bureau, or by an **individual Institution**.
- **Dedicated College Health Card**: Instant display of Trust Score, Grade Tier, total grievances, SLA breach rate, and active systemic clusters for any selected college.
- **Lifecycle Dwell-Time Bottleneck Analysis**: Identifies exact workflow drag points (e.g., *Triage to Investigation* or *Under Review*) by computing mean elapsed hours.
- **Mean Time to Resolve (MTTR) Anti-Corruption Guarantee**: Strict isolation of `Rejected` spam complaints guarantees MTTR is calculated exclusively on genuine investigated cases with timestamps (`c.resolved_at - c.created_at`), preventing zero-second bot dismissals from artificially deflating turnaround metrics.
- **Institution Comparative Performance League Table (`/api/v1/dashboard/institutions`)**:
  - Ranks technical institutions side-by-side across India by Trust Score, Resolution Rate %, Overdue SLA Breaches, and Total Complaints.
  - Multi-jurisdiction filtering: Filter colleges across States, Districts, or Bureau scopes.
  - Per-Institution Recurring Themes: Automatically breaks down top recurring grievance themes per college (e.g., *"Bharati Institute: 8 Fee Overcharging, 3 Hostel Ragging"* vs *"Avadh Institute: 5 Unapproved AI Courses"*).
  - Regulatory Intervention Status: Automates 3-tier regulatory classifications (`COMPLIANT`, `WATCHLIST`, `CRITICAL_INTERVENTION` for $\ge 3$ SLA breaches or $<35\%$ resolution rate).

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

## 8. Complete API Endpoint Catalog (FastAPI v1)

### Authentication & Bureau Management
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Service and database connectivity health probe | Public |
| `POST` | `/api/v1/auth/login` | Authenticate email/password, returning signed JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user profile, permissions, and jurisdiction | JWT Bearer |
| `GET` | `/api/v1/auth/switch-demo-role/{role}` | Instant role switch token generator for evaluation | JWT Bearer |
| `GET` | `/api/v1/bureaus` | List all registered AICTE bureaus | JWT Bearer |
| `GET` | `/api/v1/bureaus/{id}/officers` | List assigned officers in a specific bureau | JWT Bearer |

### Case Management & Lifecycle
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/cases` | Paginated, filterable, sortable complaint register | JWT Bearer |
| `GET` | `/api/v1/cases/{case_ref}` | Detailed dossier with timeline and verification badge | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/transition` | Advance case lifecycle state with mandatory remarks | JWT Bearer |
| `POST` | `/api/v1/cases/{case_ref}/reject` | Authorized rejection of malformed, invalid, or spam complaints | JWT Bearer |
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

### Identity & e-KYC Vault
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/identity/otp/send` | Send sandbox verification challenge to complainant | Public / Officer |
| `POST` | `/api/v1/identity/otp/verify` | Verify OTP code and issue cryptographically masked token | Public / Officer |

### AI Triage & Master Ticket Operations
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/ai/duplicates/check` | Analyze text payload for duplicates against case base | JWT Bearer |
| `GET` | `/api/v1/ai/duplicates/{case_ref}` | Query duplicates matching an existing case dossier | JWT Bearer |
| `POST` | `/api/v1/ai/triage/suggest` | Generate explainable bureau routing & priority suggestion| JWT Bearer |
| `GET` | `/api/v1/ai/triage/suggest/{case_ref}`| Generate triage proposal for an existing case dossier | JWT Bearer |
| `POST` | `/api/v1/ai/triage/apply` | Apply triage proposal directly to case in database | JWT Bearer |
| `GET` | `/api/v1/ai/master-tickets` | List all Master Tickets with child counts & statuses | JWT Bearer |
| `POST` | `/api/v1/ai/master-tickets/detect` | Scan database for potential unclustered duplicate groups | JWT Bearer |
| `POST` | `/api/v1/ai/master-tickets/create` | Instantiate a new Master Ticket cluster | JWT Bearer |
| `GET` | `/api/v1/ai/master-tickets/{id}` | Retrieve Master Ticket dossier with all linked children | JWT Bearer |
| `POST` | `/api/v1/ai/master-tickets/{id}/link` | Affiliate an individual complaint into a Master Ticket | JWT Bearer |
| `POST` | `/api/v1/ai/master-tickets/{id}/resolve` | Bulk resolve Master Ticket & cascade resolution to children| JWT Bearer |

### Institution Surveillance & Dynamic Credit Score
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/institutions` | List all registered AICTE institutions | JWT Bearer |
| `GET` | `/api/v1/institutions/trust-scores` | Super Admin high-risk leaderboard (ranked by score) | JWT Bearer |
| `GET` | `/api/v1/institutions/{id}/trust-score` | Detailed credit report with itemized penalty citations | JWT Bearer |
| `POST` | `/api/v1/institutions/{id}/recalculate-trust`| Force live recalculation of college credit score | JWT Bearer |
| `POST` | `/api/v1/institutions/{id}/regulatory-action`| Apply regulatory action (Show-Cause / Intake Freeze) | Admin / Supervisor |

### Telegram Bot Webhook & Student Tracker
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/telegram/webhook` | Telegram Bot API Webhook receiver for chat updates | Public (Telegram IP) |
| `GET` | `/api/v1/telegram/status` | Operational status of Telegram Bot service & webhook | JWT Bearer |
| `POST` | `/api/v1/telegram/poll-now` | Trigger immediate long-polling cycle (manual sync) | JWT Bearer |

### Executive Analytics & Dashboards
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/metrics` | Executive KPI cards (supports `?bureau_id=` & `?institution_id=`) | JWT Bearer |
| `GET` | `/api/v1/dashboard/bottlenecks` | Lifecycle dwell-time latency and bottleneck stage | JWT Bearer |
| `GET` | `/api/v1/dashboard/workload` | Cross-bureau volume & throughput metrics | JWT Bearer |
| `GET` | `/api/v1/dashboard/institutions` | Comparative League Table with state filters, SLA breaches, recurring themes & intervention status | JWT Bearer |

---

## 9. Standard Demo User Credentials (Password: `Admin@123`)

| Full Name | Role | Email | Jurisdiction / Bureau |
|---|---|---|---|
| **Smt. Sunita Sharma** | `ADMIN` | `admin@aicte-demo.gov.in` | Universal Platform Administration & Sanctions |
| **Dr. Ramesh Chandra** | `SUPERVISOR` | `supervisor@aicte-demo.gov.in` | Universal Cross-Bureau Oversight & Escalations |
| **Shri Arvind Verma** | `OFFICER` | `officer.appr@aicte-demo.gov.in` | Scoped to **Approval Bureau** (`APPR`) |
| **Shri Deepesh Goyal** | `OFFICER` | `officer.fin@aicte-demo.gov.in` | Scoped to **Finance Bureau** (`FIN`) |
| **Dr. Priya Nair** | `OFFICER` | `officer.stu@aicte-demo.gov.in` | Scoped to **Student Welfare Cell** (`STU`) |
| **Prof. Manoj Joshi** | `OFFICER` | `officer.fdc@aicte-demo.gov.in` | Scoped to **Faculty Grievance Cell** (`FDC`) |
| **CA Ananya Iyer** | `AUDITOR` | `auditor@aicte-demo.gov.in` | Universal Read-Only Inspection (PII Redacted) |

---

## 10. Local Development & Operational Verification

### Quick Start Commands

```powershell
# 1. Start Backend API Server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload

# 2. Start Frontend Dev Server
npm --prefix frontend run dev

# 3. Production Build Validation
npm --prefix frontend run build

# 4. Comprehensive Backend Test Suite
python -m pytest backend/tests/test_lifecycle.py backend/tests/test_analytics_api.py backend/tests/test_master_tickets.py backend/tests/test_institution_trust.py backend/tests/test_telegram_bot.py -v
```

### URLs & External Interfaces
- **Web Portal**: [http://localhost:5173/](http://localhost:5173/)
- **Swagger / OpenAPI Documentation**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- **Health Probe**: [http://127.0.0.1:8001/api/v1/health](http://127.0.0.1:8001/api/v1/health)
- **Official Telegram Tracker Bot**: `@aictesih_bot`
- **GitHub Repository**: [https://github.com/kartikayrwt07/SIH-PROTOTYPE.git](https://github.com/kartikayrwt07/SIH-PROTOTYPE.git)
