# AICTE Integrated Complaint Case Monitoring Dashboard

> **Enterprise Grievance Redressal, Surveillance & Intelligence Platform for Technical Education Institutions**
>
> Developed for **All India Council for Technical Education (AICTE)** to provide centralized cross-bureau visibility, autonomous zero-shot NLP triage, Digital India Bhashini multilingual localization, smart duplicate grouping (Master Tickets), role-governed lifecycle management, automated SLA breach tracking, whistleblower-shielded e-KYC verification, and virus-scanned evidentiary document storage.

---

## 🏛️ Executive Overview

Technical education institutions across India (engineering, pharmacy, management, architecture, and polytechnics) handle thousands of grievances regarding fee overcharging, ragging allegations, unapproved courses, faculty salary arrears, and infrastructure deficiencies. 

Previously, grievances were siloed within disparate cells or paper processes. This platform establishes a **single pane of glass** across AICTE's primary regulatory bureaus:
* **APPR (Approval Bureau):** Unapproved programs, land/building norm violations, lab equipment shortages.
* **FIN (Finance & Fee Regulatory Bureau):** Capitation fees, tuition overcharging, caution money refunds.
* **STU (Student Welfare & Anti-Ragging Cell):** Campus safety, senior harassment, hostel amenities.
* **FDC (Faculty Grievance Cell):** 7th CPC pay scale non-compliance, salary delays, unlawful terminations.

---

## 🚀 Key Architectural Capabilities

### 1. The "Magic" Zero-Shot Grievance Intake Engine
- **Unstructured Natural Language Processing:** Students paste raw narrative grievances in plain language.
- **Autonomous Entity Extraction:** Multi-stage collegiate extraction combining exact database matching across AICTE-registered institutions, collegiate acronym normalization (`DTU`, `VIT`, `BITS`, `COEP`, `NIT`, `IIT`), and syntactic noun phrase regex extraction.
- **384-D Dense Semantic Triage:** Evaluates text embeddings against statutory bureau archetypes, assigning category, routing bureau, and confidence distribution without human intervention.
- **Dynamic SLA Priority & Urgency Detection:** Autonomous risk evaluation triggers `URGENT` (48h turnaround) for life-safety or severe financial extortion signals (`ragging`, `physical abuse`, `suicide`, `threat to life`).
- **Autonomous Instant Docketing:** Creates legal case references (`AICTE-YYYY-XXXX`) and registers immutable audit events autonomously.

### 2. Digital India Bhashini Multilingual Localization (MeitY)
- **Indian Vernacular Script Detection:** High-accuracy linguistic detection for **Hindi (`hi`)**, **Tamil (`ta`)**, **Marathi (`mr`)**, and 8+ major Indian languages.
- **ULCA NMT Inference Pipeline:** Integrates National Language Translation Mission (Bhashini) APIs with offline statutory domain translation fallback.
- **Section 65B Legal Evidence Preservation:** Original vernacular student submissions are locked as immutable, tamper-proof legal records for ombudsman and tribunal scrutiny.
- **Dual-View Legal Comparison HUD:**
  - **Magic Intake View:** Real-time side-by-side comparison of verbatim vernacular testimony alongside AICTE English NMT translation.
  - **Case Dossier View:** Case officers can toggle between `[ English NMT ]` and `[ 📜 Original (HI / TA / MR) ]` evidence with statutory compliance watermarks.
- **1-Click Evaluator Scenarios:** Pre-loaded test cases in Hindi (Hostel Ragging), Tamil (Fee Extortion), and Marathi (Unapproved Courses).

### 3. Smart Duplicate Grouping & Master Ticket Engine
- **Dense Vector Cluster Detection:** Scans pending complaints within the same institution and category using cosine similarity (`min_similarity=0.78`, `min_group_size=3`).
- **Anchor Complaint Election:** Elects the earliest filed complaint as the cluster anchor, summarizing themes and shared keyword tokens.
- **Master Ticket Consolidation (`MT-XXXXXXXX`):** Groups identical grievances into a parent Master Ticket, tracking member cases, average similarity, and aggregate time savings.
- **Cascading Bulk Resolution:** Resolving or closing a Master Ticket automatically propagates resolution remarks and updates all child complaints simultaneously, saving ~12 minutes per grievance.
- **Master Ticket Command Hub (`MasterTicketHub.tsx`):** Real-time KPI metrics for hours saved, detected clusters, and resolution velocity.

### 4. Cloud-Native Managed Database (Supabase PostgreSQL)
- **High-Performance Relational Schema:** Automated foreign key constraints, index-optimized searches across 15+ Indian technical institutions and 150+ complaint cases.
- **Connection Pooling & Resiliency:** Integrated `psycopg2-binary` connection pooling (`pool_pre_ping=True`, `pool_recycle=300`) preventing stale connections and network dropouts.
- **Local Fallback:** Seamless dual compatibility with SQLite for offline evaluation.

### 5. High-Throughput Explainable AI & Vector Caching (~1.6 ms)
- **Deterministic NLP & TF-IDF Vectorization:** Evaluates grievance text cosine similarity against historical cases with domain-specific keyword extraction.
- **In-Memory Sparse Matrix Cache (`VectorIndexCache`):** Decouples vector calculations from synchronous database scans, dropping query response latency from >3,000ms down to **`1.66 ms`** per request.
- **Explainable Triage Recommender:** Transparent rationale breakdown (`KEYWORD_AFFINITY`, `INSTITUTION_HISTORY`, `DOMAIN_POLICY`) with confidence scores.
- **Strict Human-in-the-Loop Gating:** AI suggestions never auto-mutate cases without explicit officer confirmation.

### 6. Complainant Identity Verification & Whistleblower Shielding
- **Multi-Channel e-KYC:** Supports Mobile/Email 2FA OTP, Aadhaar VID simulation, and DigiLocker SSO.
- **Cryptographic Challenge Store:** Time-bound 10-minute OTP challenges with brute-force attempt lockout (max 5 attempts).
- **Privacy-by-Design Identity Vault:** Decouples true personal identity (Aadhaar/phone/email) from public case dossiers. Case officers see only verified institutional status (e.g., `Verified Student [XXXX-XX-3210]`), protecting student whistleblowers from campus retaliation.

### 7. Evidentiary Document & Attachment Storage
- **Proof Attachment Pipeline:** Upload fee deposit slips, affiliation certificates, bank records, and facility photos.
- **Format & Size Guards:** Whitelist validation for PDF, JPEG, PNG, WEBP, and DOCX up to 15MB.
- **Antivirus Inspection Simulation:** Computes 64-character SHA-256 integrity hashes and scans files for malware signatures (including EICAR detection), rejecting malicious payloads with HTTP 400.
- **Role-Based Redaction:** Confidential evidentiary attachments are automatically scrubbed from unprivileged and auditor viewports.

### 8. Deterministic 9-State Case Lifecycle & Tamper-Evident Audit Trail
- **Enforced State Flow:** `Received ➔ Registered ➔ Under Triage ➔ Assigned ➔ In Progress ➔ Awaiting Information ➔ Under Review ➔ Resolved ➔ Closed`.
- **Illegal Jump Guards:** Invalid transitions (e.g. `Received ➔ Closed`) are strictly blocked with HTTP 422.
- **Immutable Event Log:** Every status transition, assignment transfer, internal note, and reopening records actor, timestamp, previous state, new state, and rationale.

### 9. Dynamic SLA Aging Radar & Bottleneck Analytics
- **Working-Day Policy Engine:** Calculates dynamic target resolution deadlines based on case severity (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
- **Real-Time Aging Risk Radar:** Live classification into `OVERDUE`, `APPROACHING` (<48 hours), `ON_TRACK`, and `COMPLETED`.
- **Executive Analytics:** Lifecycle dwell-time analysis and cross-bureau workload distribution matrices.

### 10. Validated CSV Batch Pipeline & Role-Scoped Exports
- **Dry-Run Import Preview:** Field-by-field validation, missing institution alerts, duplicate grievance warnings, and atomic batch insertion.
- **Role-Scoped RFC 4180 CSV Export:** Exports case registers with server-enforced redaction of confidential notes and complainant identities for external auditors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | **FastAPI** (Python 3.11+ / 3.14 compatible), Uvicorn ASGI server |
| **ORM & Database** | **SQLAlchemy 2.0**, **PostgreSQL (Supabase)** / SQLite fallback |
| **Driver & Storage** | `psycopg2-binary`, `python-multipart`, SHA-256 file integrity hashing |
| **Multilingual Engine** | **Digital India Bhashini (MeitY)** ULCA NMT API & Indian Script Recognizer |
| **AI & NLP Engine** | **Scikit-Learn** (`TfidfVectorizer`, Cosine Similarity), `scipy.sparse` CSR caching |
| **Security & Auth** | OAuth2 Bearer JWT, Passlib, PBKDF2/bcrypt hashing, Server-Side RBAC |
| **Frontend Framework**| **React 18**, **TypeScript**, **Vite** |
| **Icons & Design** | `lucide-react`, Custom Accessible AICTE Design Tokens (Navy `#0A192F`, Saffron `#FF9933`, Emerald `#10B981`) |
| **Testing** | **Pytest** (65+ automated unit, integration, and ML benchmark tests) |

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

Create `.env` in the root:
```env
# Supabase PostgreSQL (or leave empty for default SQLite)
DATABASE_URL=postgresql+psycopg2://postgres:<PASSWORD>@<HOST>:5432/postgres?sslmode=require
ENVIRONMENT=development
SECRET_KEY=your-secure-secret-key-change-in-production

# Bhashini ULCA API Credentials (Optional - Built-in offline NMT engine activates automatically)
BHASHINI_USER_ID=
BHASHINI_API_KEY=
```

---

### Step 2: Backend Setup & Seed Data

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary scikit-learn pydantic pydantic-settings python-multipart httpx pytest

# Seed database with realistic institutions, bureaus, SLA policies, and seed cases
python -m backend.scripts.seed

# Run database migrations for multilingual & master tickets
python -m backend.app.db.migrate_multilingual
python -m backend.app.db.migrate_master_tickets

# Run FastAPI server on port 8001
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```
* **API Documentation (Swagger UI):** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
* **API Health Check:** [http://127.0.0.1:8001/api/v1/health](http://127.0.0.1:8001/api/v1/health)

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

## 🧪 Testing & Verification

The platform maintains 65+ automated unit, integration, and performance benchmark suites:

```bash
# Run all backend tests
python -m pytest backend/tests/ -v

# Run Bhashini multilingual localization tests
python -m pytest backend/tests/test_bhashini.py -v

# Run Smart Duplicate Grouping (Master Tickets) tests
python -m pytest backend/tests/test_master_tickets.py -v

# Run AI Vector Index latency benchmark
python -m pytest backend/tests/test_vector_cache_benchmark.py -s -v

# Run frontend production build
npm --prefix frontend run build
```

---

## 🔒 Security & Role Matrix

| Role | Cross-Bureau Visibility | State Advancement | Assignment | Confidential Notes & Attachments | CSV Export |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Platform Admin** | Full | All States | Any Bureau / Officer | Visible | Unredacted |
| **Supervisor** | Full | Triage / Escalate | Any Bureau / Officer | Visible | Unredacted |
| **Bureau Case Officer**| Own Bureau Only | Assigned Bureau Workflow| Internal Bureau Reassign | Visible (Own Bureau) | Redacted PII |
| **Auditor** | Read-Only Full | No Mutation | Read-Only | **Redacted / Scrubbed** | **Redacted** |

---

## 👥 Contributors
Developed for the **Smart India Hackathon (SIH)**.
Licensed under the MIT License.
