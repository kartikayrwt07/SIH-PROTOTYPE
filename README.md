# AICTE Integrated Complaint Case Monitoring & Institutional Surveillance Dashboard

> **Enterprise Grievance Redressal, Regulatory Surveillance & Autonomous AI Intelligence Platform for Technical Education Institutions**
>
> Developed for **All India Council for Technical Education (AICTE)** to provide centralized cross-bureau visibility, autonomous zero-shot NLP triage, Digital India Bhashini multilingual localization, native Supabase `pgvector` semantic embeddings, cloud storage bucket evidence management, systemic duplicate grouping (Master Tickets), zero-login student status tracking over Telegram (`@aictesih_bot`), dynamic 1000-point College Credit Scoring, and tamper-evident lifecycle auditing.

---

## 🏛️ Executive Overview

Technical education institutions across India (engineering, pharmacy, management, architecture, and polytechnics) handle thousands of grievances regarding fee extortion, ragging allegations, unapproved courses, faculty salary arrears, and infrastructure deficiencies. 

Previously, grievances were siloed within disparate cells, paper dossiers, or uncoordinated ticketing systems. This platform establishes an **active institutional surveillance and automated regulatory oversight command center** across AICTE's primary regulatory bureaus:
* **APPR (Approval Bureau):** Unapproved programs, land/building norm violations, laboratory equipment shortages.
* **FIN (Finance & Fee Regulatory Bureau):** Capitation fees, tuition overcharging, caution deposit withholding, unlawful fee hikes.
* **STU (Student Welfare & Anti-Ragging Cell):** Campus safety, senior harassment, POSH statutory non-compliance, hostel amenities.
* **FDC (Faculty Grievance Cell):** 7th CPC pay scale non-compliance, salary delays, staff exploitation, unlawful terminations.

---

## 🚀 Key Architectural Capabilities

### 1. Native Supabase `pgvector` Semantic Engine (Cloud Disk Wipe Immune)
- **Eliminates Ephemeral Storage Failures:** Replaced local filesystem `.npy` vector files with Supabase's native PostgreSQL `pgvector` extension and the dedicated `case_embeddings` table.
- **Immunity Across Cloud Deployments:** When deployed on containerized cloud platforms (Render, Heroku, AWS ECS, Fly.io), vector state survives pod restarts, redeployments, and scale-to-zero cycles with zero data loss.
- **384-D Dense Semantic Vectors:** Powered by ONNX `fastembed` (`BAAI/bge-small-en-v1.5`), generating unit-normalized embeddings in `<10ms` with zero heavy GPU or PyTorch server overhead.
- **Native SQL HNSW Cosine Indexing:** Indexed with PostgreSQL HNSW (`vector_cosine_ops`), executing sub-millisecond native SQL vector searches:
  ```sql
  SELECT case_reference_id, subject, 1 - (embedding <=> :q_vec) AS similarity
  FROM case_embeddings
  WHERE 1 - (embedding <=> :q_vec) >= :threshold
  ORDER BY embedding <=> :q_vec ASC;
  ```

### 2. Cloud Storage Buckets for Evidentiary Documents (Supabase Storage / AWS S3)
- **Secure Cloud Object Storage:** Replaced local file path storage with authenticated cloud bucket URLs via [`cloud_storage.py`](backend/app/services/cloud_storage.py).
- **Direct CDN Access (`secure_url`):** Stores permanent authenticated URLs in the database (`https://rocrtbthsbdkwikatjjf.supabase.co/storage/v1/object/public/aicte-case-evidence/...`), eliminating broken links and container storage crashes.
- **MIME & Size Enforced:** Strict validation for PDF, PNG, JPEG, WEBP, and DOCX files up to 15MB.
- **Antivirus & Hash Integrity:** Automatic 64-character SHA-256 integrity hashing and heuristic ClamAV / EICAR signature inspection before commit.
- **Cloud Evidence HUD:** Integrated tab in `CaseDetailView.tsx` allowing officers to preview proof documents or upload new inspection evidence with one click.

### 3. Smart Duplicate Grouping & Master Ticket Engine
- **Dense Vector Cluster Detection:** Scans complaints within the same institution and category using calibrated cosine similarity (`0.78` Duplicate, `0.65` Cluster).
- **Domain Boilerplate Pruning:** Strips formal institutional stopwords (`AICTE`, `college`, `institution`, `complaint`, `sir`, `madam`) before vector comparison to prevent false-positive flood cascades.
- **Master Ticket Consolidation (`MT-XXXXXXXX`):** Binds orphan complaints into parent clusters with automated anchor case election.
- **1-Click Cascading Bulk Resolution:** Resolving or closing a Master Ticket automatically cascades resolution orders and updates all linked child complaints simultaneously, saving **~85%** of administrative review time during campus crises.
- **Master Ticket Command Hub (`MasterTicketHub.tsx`):** Real-time cluster visualization and bulk resolution workbench.

### 4. Zero-Login Telegram Bot Tracker (`@aictesih_bot`)
- **Zero Authentication Barrier:** Complainants simply text their Case Reference ID (`AICTE-2026-X9K2P`) or Master Ticket ID (`MT-XXXX`) to official `@aictesih_bot` and receive an instantaneous status update.
- **Natural Language Regex Parser:** Automatically extracts case IDs from conversational messages (e.g., *"What is the status of AICTE-2026-FIN-001?"*).
- **Live SLA Countdown:** Displays days remaining until statutory deadline, assigned bureau cell, and Master Ticket cluster links.
- **PII Confidentiality Shield:** Telegram outputs strictly mask student names, phone numbers, and sensitive investigative details to protect privacy.
- **Interactive Simulator View (`TelegramBotView.tsx`):** Live operational console with instant polling controls and chat testing sandbox.

### 5. Dynamic Institution Trust Score (College Credit Score out of 1000)
- **Automated Regulatory Oversight:** Every technical institution begins with a pristine credit score of **1,000 points (Tier AAA)**.
- **Mathematical Penalty Ledger:**
  - Overdue SLA Deadline Breach: `-45 points`
  - Approaching SLA Warning (<48h): `-15 points`
  - Urgent Priority Grievance (Ragging / POSH / Safety): `-50 points`
  - Sensitive AICTE Statutory Violation: `-35 points`
  - Unresolved Backlog (>30 days): `-20 points`
  - Master Ticket Systemic Student Cluster: `-60 points`
- **Recovery Incentives:** `+15 points` per prompt resolution, `+40 points` bonus for maintaining $\ge 80\%$ resolution rate, and `+30 points` clean streak bonus.
- **6-Tier Regulatory Action Matrix:**
  | Score Range | Grade | Risk Tier | Automated Regulatory Directive | Action Code |
  | :--- | :--- | :--- | :--- | :--- |
  | **850 – 1000** | **AAA** | Tier 1 (Exemplary Trust) | Eligible for fast-track autonomy & EOA auto-approval | `ROUTINE_COMPLIANCE` |
  | **700 – 849** | **AA** | Tier 2 (Good Standing) | Standard annual verification applies | `ROUTINE_COMPLIANCE` |
  | **550 – 699** | **A-** | Tier 3 (Moderate Scrutiny) | Mandatory quarterly ombudsman report submission | `HEIGHTENED_MONITORING` |
  | **400 – 549** | **BBB** | Tier 4 (Watchlist) | Formal AICTE advisory warning issued | `SHOW_CAUSE_SUMMONS` |
  | **250 – 399** | **B** | Tier 5 (High Risk) | Automated Show-Cause Notice issued to Governing Board | `SHOW_CAUSE_SUMMONS` |
  | **< 250** | **C** | Tier 6 (Critical Red Zone) | Mandatory On-Site Inspection & Academic Intake Freeze | `MANDATORY_INSPECTION_FREEZE` |
- **Super Admin Leaderboard (`InstitutionTrustLeaderboard.tsx`):** Ranks the worst-performing technical colleges nationwide, displaying itemized deduction citations and 1-click regulatory sanction dispatches.

### 6. Executive Dashboard with Dual-Filter Scoping & MTTR Protection
- **Multi-Level Surveillance:** Filter entire platform analytics by **All-India Overview**, by **Specific Bureau**, or by an **Individual College**.
- **Dedicated College Health Card:** Instant display of live Trust Score, Grade Tier, total grievances, resolution velocity, and active systemic clusters for any selected institution.
- **Lifecycle Dwell-Time Bottleneck Analysis:** Pinpoints exact administrative drag points (e.g. *Triage to Investigation* vs *Under Review*) by computing mean elapsed hours.
- **MTTR Anti-Corruption Isolation:** Excludes rejected spam complaints from Mean Time to Resolve calculations (`resolved_at - created_at`), preventing bot dismissals from artificially distorting turnaround metrics.
- **Institution Comparative League Table (`/api/v1/dashboard/institutions`):** Side-by-side performance ranking across Indian States & Union Territories with automated classification into `COMPLIANT`, `WATCHLIST`, or `CRITICAL_INTERVENTION`.

### 7. Digital India Bhashini Multilingual Localization (MeitY)
- **Indian Vernacular Script Detection:** High-accuracy linguistic detection for **Hindi (`hi`)**, **Tamil (`ta`)**, **Marathi (`mr`)**, and 8+ major Indian languages.
- **ULCA NMT Inference Pipeline:** Integrates National Language Translation Mission (Bhashini) APIs with offline statutory domain translation fallback.
- **Section 65B Legal Evidence Preservation:** Original vernacular student submissions are locked as immutable, tamper-proof legal records for ombudsman and tribunal scrutiny.
- **Dual-View Legal Comparison HUD:** Verbatim vernacular testimony alongside AICTE English NMT translation in both Magic Intake and Case Dossier views.

### 8. Whistleblower Cryptographic Shield & e-KYC Vault
- **Zero-Knowledge Identity Decoupling:** Personal identity (Aadhaar/phone/email) is stored encrypted in `complainant_identities` segregated from case dossiers.
- **Campus Retaliation Shield:** College administrators and case officers see only verified institutional status (e.g., `Verified Student [XXXX-XX-3210]`), shielding students from victimisation.
- **Multi-Channel e-KYC:** Supports Mobile/Email 2FA OTP, Aadhaar VID simulation, and DigiLocker SSO.

### 9. Deterministic 9-State Case Lifecycle & Audit Trail
- **Enforced State Flow:** `Received ➔ Registered ➔ Under Triage ➔ Assigned ➔ In Progress ➔ Awaiting Information ➔ Under Review ➔ Resolved ➔ Closed`.
- **Illegal Jump Guards:** Invalid transitions (e.g. moving from `Received` directly to `Resolved`) are rejected with `HTTP 422`.
- **Immutable Append-Only Audit Log:** Every status transition, assignment transfer, internal note, and reopening records actor, timestamp, previous state, new state, and metadata.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | **FastAPI** (Python 3.11+ / 3.14 compatible), Uvicorn ASGI server |
| **ORM & Database** | **SQLAlchemy 2.0**, **PostgreSQL (Supabase)** with connection pooling / SQLite fallback |
| **Vector Engine** | **Supabase `pgvector`** with native HNSW cosine index (`vector_cosine_ops`), Fastembed ONNX |
| **Cloud Storage** | **Supabase Storage Buckets** / **AWS S3** with authenticated `secure_url` CDN delivery |
| **Multilingual Engine** | **Digital India Bhashini (MeitY)** ULCA NMT API & Indian Script Recognizer |
| **Omnichannel Bots** | **Telegram Bot API** (`@aictesih_bot`) with async webhook and long-polling engines |
| **Security & Auth** | OAuth2 Bearer JWT (HMAC-SHA256), salted PBKDF2/bcrypt hashing, Server-Side RBAC |
| **Frontend Framework**| **React 18**, **TypeScript**, **Vite** |
| **Design System** | Accessible AICTE Design Tokens (Navy `#0A192F`, Saffron `#FF9933`, Emerald `#10B981`), `lucide-react` |
| **Testing** | **Pytest** (95+ automated unit, integration, and performance benchmark tests) |

---

## 🚦 Getting Started

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm
- Git

---

### Step 1: Clone & Configure Environment

```bash
git clone https://github.com/kartikayrwt07/SIH-PROTOTYPE.git
cd SIH
```

Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql+psycopg2://postgres:<PASSWORD>@<HOST>:5432/postgres?sslmode=require
ENVIRONMENT=development
SECRET_KEY=aicte-secret-key-change-in-production
TELEGRAM_BOT_TOKEN=8894242071:AAEWh33FUAIB1jcjOmuyMAB062sTIBhQOr0

# Optional Cloud Storage configuration
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://rocrtbthsbdkwikatjjf.supabase.co
SUPABASE_STORAGE_BUCKET=aicte-case-evidence
```

---

### Step 2: Backend Setup & Automated Migrations

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pgvector fastembed pydantic pydantic-settings python-multipart httpx pytest

# Seed database with realistic institutions, bureaus, SLA policies, and seed complaints
python -m backend.scripts.seed

# Run automated migrations (pgvector, storage URLs, master tickets, multilingual)
python -m backend.app.db.migrate_pgvector
python -m backend.app.db.migrate_storage_url
python -m backend.app.db.migrate_master_tickets
python -m backend.app.db.migrate_multilingual

# Start FastAPI server on port 8001
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```
* **Swagger API Documentation:** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
* **Health Probe:** [http://127.0.0.1:8001/api/v1/health](http://127.0.0.1:8001/api/v1/health)

---

### Step 3: Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite development server on port 5173
npm run dev
```
* **Web Application UI:** [http://localhost:5173/](http://localhost:5173/)

---

## 🧪 Comprehensive Testing Suite

The platform maintains 95+ automated unit, integration, and ML benchmark tests:

```bash
# Run all backend tests
python -m pytest backend/tests/ -v

# Run Supabase pgvector persistence tests (verifies zero disk wipe loss)
python -m pytest backend/tests/test_pgvector.py -v

# Run Cloud Storage Buckets & secure_url tests
python -m pytest backend/tests/test_cloud_storage.py -v

# Run Smart Duplicate Master Ticket tests
python -m pytest backend/tests/test_master_tickets.py -v

# Run Institution Trust Score & Regulatory Sanction tests
python -m pytest backend/tests/test_institution_trust.py -v

# Run Telegram Bot Tracker tests
python -m pytest backend/tests/test_telegram_bot.py -v

# Run production frontend build validation
npm --prefix frontend run build
```

---

## 🔒 Security & Role-Based Access Control (RBAC)

| Role | Cross-Bureau Visibility | State Advancement | Assignment & Routing | Confidential Notes & Evidence | Regulatory Sanctions | CSV Export |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Platform Admin** | Universal (All 4 Bureaus) | All 9 States | Any Bureau / Officer | Full Access | Full Authority | Full Unredacted |
| **Supervisor** | Universal (All 4 Bureaus) | Triage / Escalate | Any Bureau / Officer | Full Access | Review / Recommend | Full Unredacted |
| **Bureau Case Officer**| Own Bureau Only | Assigned Bureau Workflow| Internal Bureau Reassign | Visible (Own Bureau) | Read Only | Scoped & Redacted |
| **Auditor** | Universal Read-Only | No Mutation | Read-Only | **Strictly Redacted** | None | **PII Redacted** |

---

## 👥 Contributors & License
Developed for the **Smart India Hackathon (SIH)**.  
Licensed under the [MIT License](LICENSE).
