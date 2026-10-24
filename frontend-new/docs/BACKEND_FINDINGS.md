# Backend Findings — Step 0 Audit

> **Audited**: 2026-10-24 (IST)  
> **Backend**: FastAPI at `http://127.0.0.1:8001`  
> **Status**: Backend is running and reachable; DB connection is healthy, but the **database is not seeded** (all tables are empty). Every endpoint except `/api/v1/health` returns `500 INTERNAL_SERVER_ERROR` because models hit empty tables.

---

## 1. Database / Seed State

The SQLite file exists at `SIH-PROTOTYPE/aicte_complaints.db` but contains **no tables and no rows**.  
`sqlite_master` is empty — `Base.metadata.create_all()` has not been called and `seed.py` has not been run.

**Action required (for backend teammate):**
```bash
cd SIH-PROTOTYPE
source .venv/bin/activate
python -m backend.scripts.seed
```

Until this is done, all live-backend checks below are based on **source-code reading only** (not live curl responses).

---

## 2. Authentication

### 2a. `GET /api/v1/auth/switch-demo-role/{role_name}`

Valid `role_name` values (case-insensitive, uppercased internally):
```
ADMIN | SUPERVISOR | OFFICER | AUDITOR
```

**Response shape** (`StandardResponse[dict]`):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "full_name": "...",
      "role": "ADMIN",
      "bureau_id": null
    },
    "token": "<JWT access_token string>"
  },
  "error": null,
  "metadata": null
}
```
Token field name is **`token`** (not `access_token`). Use `data.token` from this endpoint.

### 2b. `POST /api/v1/auth/login`

Request: `{ "email": "...", "password": "..." }`  
Response: `StandardResponse[Token]` where `Token = { access_token: string, token_type: "bearer" }`.  
Token field name is **`access_token`** here (different from switch-demo-role).

### 2c. `GET /api/v1/auth/me`

Requires `Authorization: Bearer <token>` OR `X-Demo-Role: <role>` header.  
Returns `StandardResponse[AuthUserResponse]`:
```json
{
  "data": {
    "id": "...", "email": "...", "full_name": "...",
    "role": "ADMIN",
    "bureau_id": null, "bureau_name": null, "bureau_code": null,
    "permissions": ["cases:read:all", "cases:create", ...]
  }
}
```

### 2d. Demo Auth Header (X-Demo-Role)

The backend supports a **`X-Demo-Role`** header for auth (no token needed).  
Optionally pair with `X-Demo-Email` to pick a specific demo user.  
This is the mechanism the frontend should use for the role-switcher in dev/mock mode.

**SPEC deviation**: SPEC says headers are `X-User-Role` and `X-User-Bureau-Id`. The real backend uses `X-Demo-Role` and `X-Demo-Email`. The `X-User-Role` / `X-User-Bureau-Id` headers do NOT exist in the backend.

---

## 3. Demo Users (from `backend/scripts/seed.py`)

| Email | Full Name | Role | Bureau |
|-------|-----------|------|--------|
| `admin@aicte-demo.gov.in` | Smt. Sunita Sharma (Admin) | ADMIN | — |
| `supervisor@aicte-demo.gov.in` | Dr. Ramesh Chandra (Supervisor) | SUPERVISOR | — |
| `officer.appr@aicte-demo.gov.in` | Shri Arvind Verma (Officer - Approval) | OFFICER | APPR |
| `officer.stu@aicte-demo.gov.in` | Dr. Priya Nair (Officer - Student Welfare) | OFFICER | STU |
| `officer.fdc@aicte-demo.gov.in` | Prof. Manoj Joshi (Officer - Faculty Grievance) | OFFICER | FDC |
| `officer.fin@aicte-demo.gov.in` | Shri Deepesh Goyal (Officer - Finance) | OFFICER | FIN |
| `auditor@aicte-demo.gov.in` | CA Ananya Iyer (Auditor) | AUDITOR | — |

Password stored as `"demo_hashed_password"` — actual plain-text password for demo login is unknown (not shown in seed). Use `switch-demo-role` instead.

---

## 4. Bureaus — CRITICAL DEVIATION from SPEC

**SPEC says** bureau codes are: `APPR | PAB | SDC | ADMIN_BUR`  
**Real seed data** uses: `APPR | STU | FDC | FIN`

| Code | Name | Description |
|------|------|-------------|
| `APPR` | Approval Bureau | Institutional compliance with AICTE norms |
| `STU` | Student Welfare Cell | Ragging, safety, mental health, hostel |
| `FDC` | Faculty Grievance Cell | Salary arrears, 7th CPC, termination |
| `FIN` | Finance & Fee Regulatory Bureau | Capitation fees, excess tuition, deposits |

**Action**: Update mock data and all type references to use `APPR | STU | FDC | FIN` codes.

### `GET /api/v1/bureaus/{bureau_id}/officers`

Returns `StandardResponse[List]` where each item is:
```json
{ "id": "...", "email": "...", "full_name": "...", "role": "OFFICER" }
```
No `bureau_id` field in the officer item. No `model_config` (plain dict, not a Pydantic model).

---

## 5. Bureau Scoping Rules (enforced server-side)

| Role | Cases visible | Notes |
|------|--------------|-------|
| ADMIN | All bureaus | Full write access |
| SUPERVISOR | All bureaus | Can assign; cannot import or change status |
| OFFICER | Own bureau only | Hard-filtered by `bureau_id` in DB query |
| AUDITOR | All bureaus (read-only, redacted) | `description_confidential` is `null` |

---

## 6. State Machine (from `backend/app/services/lifecycle.py`)

```
Received → Registered
Registered → Under Triage
Under Triage → Assigned
Assigned → In Progress
In Progress → Awaiting Information | Under Review
Awaiting Information → In Progress
Under Review → In Progress | Resolved
Resolved → Closed | In Progress (Reopen)
Closed → (terminal, no transitions)
```

This **matches SPEC section 7** exactly.

### Transition Role Permissions

The `transition_case_status` endpoint has **no `require_roles()` guard** — any authenticated user may call it. Bureau access is enforced via `assert_bureau_access` (OFFICER restricted to own bureau). AUDITOR cannot transition because they lack bureau-level write access conceptually, but no explicit role block exists in the transition endpoint.

SPEC says AUDITOR cannot transition — this is correct in practice because AUDITOR has no `cases:update:status` permission, but the server does not explicitly block it. The frontend must gate the UI.

---

## 7. Notes Endpoint

`GET /api/v1/cases/{case_ref}/notes` — returns `StandardResponse[List[CaseNoteRead]]`

**Confidential note filtering for AUDITOR**: The backend reads notes and the `sanitize_case_for_role` function only nulls `description_confidential` on the _case_, **not** on individual notes. Looking at the `list_case_notes` endpoint (from cases.py), notes are returned as-is; AUDITOR sees `is_confidential` flag but the `content` is NOT stripped.

**SPEC says auditors should not see confidential note content.** This is a **backend gap**. Do not show `content` of notes where `is_confidential=true` to AUDITOR role in the frontend.

---

## 8. Timeline Events (`metadata_json` keys)

From seed.py and lifecycle.py, `metadata_json` contains these keys depending on event type:

| Event Type | Keys in metadata_json |
|------------|-----------------------|
| REGISTERED | `channel`, `batch_id` |
| STATUS_CHANGE | `remarks`, `action` |
| REASSIGNED | `transfer_reason`, `from_bureau`, `to_bureau` (from assignment service) |
| ESCALATED | `reason`, `level` (from escalation service) |
| NOTE_ADDED | `note_id`, `is_confidential` |
| RESOLVED | `remarks`, `action` |
| CLOSED | `remarks`, `action` |
| REOPENED | `remarks`, `action` |

The primary human-readable field is always **`remarks`** (for transitions) or **`reason`** (for escalations). Both may be absent — treat as optional.

---

## 9. CSV Import

### `POST /api/v1/cases/import/preview`

Accepts either:
1. **Multipart form-data** with field name **`file`** (uploaded CSV file)
2. **JSON body** with key `"csv_content"` (raw CSV text string)

Required CSV columns (header matching is fuzzy/substring-based):
```
institution_aicte_id, bureau_code, subject, category, priority, description, is_confidential
```
`priority` and `is_confidential` are optional (default MEDIUM / false).

**SPEC says** AICTE ID pattern: `^\d-\d{7}$` — this matches what the backend validates against the Institution table (exact match on `aicte_permanent_id`). Invalid AICTE IDs get a `CsvRowError`.

**Response** (`StandardResponse[CsvPreviewResponse]`):
```json
{
  "data": {
    "total_rows": 5,
    "valid_rows": 4,
    "invalid_rows": 1,
    "can_commit": true,
    "rows": [
      {
        "row_number": 1, "is_valid": true,
        "institution_aicte_id": "1-3456789", "institution_name": "...",
        "bureau_code": "APPR", "bureau_name": "Approval Bureau",
        "subject": "...", "category": "...", "priority": "MEDIUM",
        "is_confidential": false, "description": "...",
        "errors": [],
        "warnings": [],
        "duplicate_case_ref": null
      },
      {
        "row_number": 2, "is_valid": false,
        "errors": [{ "row_number": 2, "field": "bureau_code", "message": "Unknown bureau code 'XYZ'" }],
        ...
      }
    ]
  }
}
```

### `POST /api/v1/cases/import/commit`

JSON body: `{ "rows": [...CsvRowPreview objects...], "skip_invalid": true }`

---

## 10. Role Permissions Matrix (from `backend/app/core/auth.py`)

| Permission | ADMIN | SUPERVISOR | OFFICER | AUDITOR |
|-----------|-------|-----------|---------|---------|
| cases:read:all | ✓ | ✓ | — | (redacted) |
| cases:create | ✓ | — | — | — |
| cases:update:status | ✓ | — | ✓ | — |
| cases:assign | ✓ | ✓ | — | — |
| cases:notes:create | ✓ | ✓ | ✓ | — |
| cases:notes:read:confidential | ✓ | ✓ | ✓ | — |
| cases:export | ✓ | ✓ | — | (redacted) |
| cases:import | ✓ | — | — | — |
| dashboard:read:all | ✓ | ✓ | — | ✓ |
| settings:manage | ✓ | — | — | — |
| audit:read:all | ✓ | ✓ | — | ✓ |

**SPEC deviations:**
- SPEC says SUPERVISOR can escalate — backend has no explicit role guard on escalate endpoint; bureau access is checked. OK.
- SPEC says OFFICER can escalate — same, no explicit block. OK.
- CSV import: backend allows ADMIN only (no explicit guard, but only ADMIN has `cases:import` permission).

---

## 11. Error Response Formats

### 401 Unauthorized (invalid/expired token)
```json
{
  "success": false, "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token",
    "details": null, "timestamp": "..."
  },
  "metadata": null
}
```
*(HTTP header: `WWW-Authenticate: Bearer`)*

### 403 Forbidden (role or bureau mismatch)
```json
{
  "success": false, "data": null,
  "error": {
    "code": "INSUFFICIENT_ROLE_PERMISSIONS",
    "message": "User role 'AUDITOR' is not permitted to perform this operation.",
    "details": [{ "field": null, "message": "allowed_roles: [\"ADMIN\"]" }],
    "timestamp": "..."
  }
}
```
Or for bureau mismatch:
```json
{ "code": "INSUFFICIENT_BUREAU_PERMISSIONS", "message": "Access denied: Case belongs to another bureau..." }
```

### 422 Unprocessable Entity (invalid transition)
```json
{
  "success": false, "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request payload failed validation schema.",
    "details": [{ "field": "body -> to_status", "message": "..." }],
    "timestamp": "..."
  }
}
```
Or for illegal lifecycle transitions (raised as HTTPException directly):
```json
{
  "detail": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition case AICTE-2026-1001 from 'Received' to 'Resolved'.",
    "current_status": "Received",
    "attempted_status": "Resolved",
    "allowed_transitions": ["Registered"]
  }
}
```
**Note**: When FastAPI raises `HTTPException` directly, the response body is `{ "detail": ... }`, NOT wrapped in `StandardResponse`. This is a **backend inconsistency** — the transition 422 uses raw FastAPI `detail`, not `StandardResponse.error`. The adapter must handle both shapes.

---

## 12. CORS Configuration

From `backend/app/core/config.py`:
```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

- ✅ `http://localhost:5173` — **allowed** (Vite default dev port)
- ✅ `http://127.0.0.1:5173` — **allowed**
- ❌ `http://localhost:8080` — **NOT in the allowed list**

**Action for backend teammate**: Add `http://localhost:8080` to `CORS_ORIGINS` if you use port 8080.

---

## 13. `description_confidential` for AUDITOR

`sanitize_case_for_role()` in `backend/app/core/auth.py` sets `description_confidential = None` when `user_role == UserRole.AUDITOR`. This is applied on all case read endpoints.

Confirmed: **AUDITOR always gets `null` for `description_confidential`**.

**Notes confidentiality gap**: The `list_case_notes` endpoint does NOT filter note content for AUDITOR. Frontend must hide `content` of notes with `is_confidential=true` when current role is AUDITOR.

---

## 14. ComplaintCaseRead — Extra Fields vs SPEC

The real `ComplaintCaseRead` schema includes these fields **not in the SPEC `ComplaintCase` interface**:

| Field | Type | Notes |
|-------|------|-------|
| `updated_at` | datetime | Always present |
| `resolved_at` | datetime? | Set when status → Resolved |
| `closed_at` | datetime? | Set when status → Closed |
| `closure_remarks` | string? | Set on Resolved/Closed |
| `complainant_identity_id` | string? | Privacy-sensitive; ignore in UI |
| `complainant_verification_badge` | dict? | Ignore in UI |
| `institution` | InstitutionRead? | Nested: id, aicte_permanent_id, name, state, district, institution_type |
| `bureau` | BureauRead? | Nested: id, code, name, description, is_active, created_at |
| `assigned_officer` | UserSummary? | Nested: id, email, full_name, role |

The SPEC `ComplaintCase` has flat fields like `institution_name`, `bureau_name`, `bureau_code`, `assigned_officer_name`. The **real backend uses nested objects**. The adapter must flatten these.

---

## 15. Case List Response Envelope

`GET /api/v1/cases` returns `PaginatedResponse[ComplaintCaseRead]` (NOT `StandardResponse`):
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "page": 1, "page_size": 20,
    "total_records": 58, "total_pages": 3,
    "has_next": true, "has_prev": false
  }
}
```
No `error` field. The `metadata` field here is `PaginationMetadata`, not the generic `metadata: dict` from `StandardResponse`.

---

## 16. SLA Radar Endpoint

`GET /api/v1/cases/sla-radar` — returns `StandardResponse[SlaRadarSummary]`

```json
{
  "data": {
    "total_active_cases": 44,
    "overdue_count": 8,
    "approaching_count": 9,
    "on_track_count": 27,
    "completed_count": 14,
    "overdue_cases": [{ "case_reference_id": "...", "sla_status": "OVERDUE", "hours_remaining": -12.5, "is_overdue": true, ... }],
    "approaching_cases": [{ ..., "sla_status": "APPROACHING", "hours_remaining": 18.3, "is_overdue": false, ... }]
  }
}
```

SLA status strings from backend: `"OVERDUE"`, `"APPROACHING"`, `"ON_TRACK"` (uppercase with underscore).

---

## 17. Case Reference ID Format

From `csv_io.py`, the format is `AICTE-{YEAR}-{NUMBER}` (no zero-padding in the generator, e.g., `AICTE-2026-1001`).  
From seed.py, the seeder uses `AICTE-2026-{i+1:05d}` (5-digit zero-padded), so seeded cases are `AICTE-2026-00001` through `AICTE-2026-00058`.  
The CSV import generator uses a different format (no zero-padding, starting at 1001). **Inconsistency in backend** — record as-is, display whatever string comes back.

---

## 18. Dashboard Stats Endpoint

**SPEC mentions** `getDashboardStats`. Checking the router:

`GET /api/v1/cases/dashboard` (or similar) — needs verification. The backend `cases.py` has a `/dashboard` GET endpoint. Response includes bureau-level breakdown, KPIs, etc. Not shown in detail here — will adapt from live response once DB is seeded.

---

## Summary of Actions Needed

| Priority | Who | Action |
|----------|-----|--------|
| 🔴 BLOCKER | Backend teammate | Run `python -m backend.scripts.seed` to populate the DB |
| 🟡 SPEC FIX | Frontend (me) | Change bureau codes: `PAB→STU`, `SDC→FDC`, `ADMIN_BUR→FIN` in all mock data and types |
| 🟡 SPEC FIX | Frontend (me) | Auth header is `X-Demo-Role`, not `X-User-Role`; token from switch-demo-role is in `data.token` |
| 🟡 SPEC FIX | Frontend (me) | Adapter must flatten nested `institution`, `bureau`, `assigned_officer` from case responses |
| 🟡 SPEC FIX | Frontend (me) | Handle dual 422 error shapes (StandardResponse.error vs raw `{detail: ...}`) |
| 🟡 SPEC FIX | Frontend (me) | Filter confidential note content for AUDITOR in the UI (backend doesn't do it) |
| 🟢 MINOR | Backend teammate | Add `http://localhost:8080` to CORS_ORIGINS if needed |
