# AICTE Integrated Complaint Case Monitoring Dashboard

> **Enterprise Grievance Redressal, Surveillance & Intelligence Platform for Technical Education Institutions**
>
> Developed for **All India Council for Technical Education (AICTE)** to provide centralized, cross-bureau visibility, role-governed lifecycle management, automated SLA breach tracking, whistleblower-shielded e-KYC verification, virus-scanned evidentiary document storage, and high-throughput explainable AI triage.

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

### 1. Cloud-Native Managed Database (Supabase PostgreSQL)
- **High-Performance Relational Schema:** Automated foreign key constraints, index-optimized searches across 15+ Indian technical institutions and 50+ complaint cases.
- **Connection Pooling & Resiliency:** Integrated `psycopg2-binary` connection pooling (`pool_pre_ping=True`, `pool_recycle=300`) preventing stale connections and network dropouts.
- **Local Fallback:** Seamless dual compatibility with SQLite for offline evaluation.

### 2. High-Throughput Explainable AI & Vector Caching (~1.6 ms)
- **Deterministic NLP & TF-IDF Vectorization:** Evaluates grievance text cosine similarity against historical cases with domain-specific keyword extraction.
- **In-Memory Sparse Matrix Cache (`VectorIndexCache`):** Decouples vector calculations from synchronous database scans, dropping query response latency from >3,000ms down to **`1.66 ms`** per request.
- **Explainable Triage Recommender:** Transparent rationale breakdown (`KEYWORD_AFFINITY`, `INSTITUTION_HISTORY`, `DOMAIN_POLICY`) with confidence scores.
- **Strict Human-in-the-Loop Gating:** AI suggestions never auto-mutate cases without explicit officer confirmation.

### 3. Complainant Identity Verification & Whistleblower Shielding
- **Multi-Channel e-KYC:** Supports Mobile/Email 2FA OTP, Aadhaar VID simulation, and DigiLocker SSO.
- **Cryptographic Challenge Store:** Time-bound 10-minute OTP challenges with brute-force attempt lockout (max 5 attempts).
- **Privacy-by-Design Identity Vault:** Decouples true personal identity (Aadhaar/phone/email) from public case dossiers. Case officers see only verified institutional status (e.g., `Verified Student [XXXX-XX-3210]`), protecting student whistleblowers from campus retaliation.

### 4. Evidentiary Document & Attachment Storage
- **Proof Attachment Pipeline:** Upload fee deposit slips, affiliation certificates, bank records, and facility photos.
- **Format & Size Guards:** Whitelist validation for PDF, JPEG, PNG, WEBP, and DOCX up to 15MB.
- **Antivirus Inspection Simulation:** Computes 64-character SHA-256 integrity hashes and scans files for malware signatures (including EICAR detection), rejecting malicious payloads with HTTP 400.
- **Role-Based Redaction:** Confidential evidentiary attachments are automatically scrubbed from unprivileged and auditor viewports.

### 5. Deterministic 9-State Case Lifecycle & Tamper-Evident Audit Trail
- **Enforced State Flow:** `Received ➔ Registered ➔ Under Triage ➔ Assigned ➔ In Progress ➔ Awaiting Information ➔ Under Review ➔ Resolved ➔ Closed`.
- **Illegal Jump Guards:** Invalid transitions (e.g. `Received ➔ Closed`) are strictly blocked with HTTP 422.
- **Immutable Event Log:** Every status transition, assignment transfer, internal note, and reopening records actor, timestamp, previous state, new state, and rationale.

### 6. Dynamic SLA Aging Radar & Bottleneck Analytics
- **Working-Day Policy Engine:** Calculates dynamic target resolution deadlines based on case severity (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
- **Real-Time Aging Risk Radar:** Live classification into `OVERDUE`, `APPROACHING` (<48 hours), `ON_TRACK`, and `COMPLETED`.
- **Executive Analytics:** Lifecycle dwell-time analysis and cross-bureau workload distribution matrices.

### 7. Validated CSV Batch Pipeline & Role-Scoped Exports
- **Dry-Run Import Preview:** Field-by-field validation, missing institution alerts, duplicate grievance warnings, and atomic batch insertion.
- **Role-Scoped RFC 4180 CSV Export:** Exports case registers with server-enforced redaction of confidential notes and complainant identities for external auditors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | **FastAPI** (Python 3.11+ / 3.14 compatible), Uvicorn ASGI server |
| **ORM & Database** | **SQLAlchemy 2.0**, **PostgreSQL (Supabase)** / SQLite fallback |
| **Driver & Storage** | `psycopg2-binary`, `python-multipart`, SHA-256 file hashing |
| **AI & NLP Engine** | **Scikit-Learn** (`TfidfVectorizer`, Cosine Similarity), `scipy.sparse` CSR caching |
| **Security & Auth** | OAuth2 Bearer JWT, Passlib, PBKDF2/bcrypt hashing, Server-Side RBAC |
| **Frontend Framework**| **React 18**, **TypeScript**, **Vite** |
| **Design System** | Custom Accessible AICTE Design Tokens (Navy `#0A192F`, Saffron `#FF9933`, Slate `#F8FAFC`) |
| **Testing** | **Pytest** (50 passing automated tests covering all modules) |

---

## 🚦 Getting Started

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm
- Git

---

### Step 1: Clone & Configure Environment

```bash
git clone <YOUR_REPO_URL>
cd SIH
```

Create `.env` in the root and in `backend/.env`:
```env
# Supabase PostgreSQL (or leave empty for default SQLite)
DATABASE_URL=postgresql+psycopg2://postgres:<PASSWORD>@<HOST>:5432/postgres?sslmode=require
ENVIRONMENT=development
SECRET_KEY=your-secure-secret-key-change-in-production
```

---

### Step 2: Backend Setup & Seed Data

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r pyproject.toml
# or
pip install fastapi uvicorn sqlalchemy psycopg2-binary scikit-learn pydantic pydantic-settings python-multipart httpx pytest

# Seed database with realistic institutions, bureaus, SLA policies, and 58 cases
python -m backend.scripts.seed

# Run FastAPI server
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

# Start Vite development server
npm run dev
```
* **Web Application UI:** [http://localhost:5173/](http://localhost:5173/)

---

## 🧪 Testing & Verification

The platform maintains comprehensive automated unit, integration, and performance benchmark suites.

```bash
# Run complete test suite (50 passing tests)
python -m pytest backend/tests -v

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
