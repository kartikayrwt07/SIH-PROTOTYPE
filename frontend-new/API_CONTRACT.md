# AICTE Complaint Dashboard — API Contract

> **Document Status**: Generated in Step 1.  
> **Source of Truth Priority**: Live Responses → Backend Source (`backend/`) → `docs/openapi.json` → `SPEC.md`.  
> Every endpoint and header below is marked as either **CONFIRMED** (verified in backend code/live probe during Step 0) or **ASSUMED** (pending verification against live backend once seeded).

---

## 1. Authentication & Headers

### Headers

| Header | Status | Usage |
|---|---|---|
| `Authorization: Bearer <token>` | **CONFIRMED** | Standard JWT authentication for all protected endpoints |
| `X-Demo-Role: <ROLE>` | **CONFIRMED** | Demo simulation header: `ADMIN` \| `SUPERVISOR` \| `OFFICER` \| `AUDITOR`. Bypasses JWT login. |
| `X-Demo-Email: <email>` | **CONFIRMED** | Optional email selector paired with `X-Demo-Role` to select a specific officer/user. |
| `X-User-Role: <ROLE>` | **SPEC ONLY (UNSUPPORTED)** | Mentioned in `SPEC.md` §2, but **NOT** recognized by the FastAPI backend. Replaced by `X-Demo-Role`. |
| `X-User-Bureau-Id: <id>` | **SPEC ONLY (UNSUPPORTED)** | Mentioned in `SPEC.md` §2, but **NOT** recognized by backend. Bureau scoping is resolved via the user record in database. |

---

## 2. Standard Envelope Formats

### Standard Response (`StandardResponse[T]`)
Used by single-resource endpoints and mutations:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "metadata": null
}
```

### Paginated Response (`PaginatedResponse[T]`)
Used by `GET /api/v1/cases`:
```json
{
  "success": true,
  "data": [ ... ],
  "metadata": {
    "page": 1,
    "page_size": 20,
    "total_records": 58,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error Responses

#### Standard Error Envelope (400, 401, 403, 422 validation):
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_ROLE_PERMISSIONS",
    "message": "User role 'AUDITOR' is not permitted to perform this operation.",
    "details": null,
    "timestamp": "2026-10-24T10:00:00Z"
  },
  "metadata": null
}
```

#### FastAPI Direct HTTPException (e.g. 422 Invalid State Transition):
```json
{
  "detail": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition case AICTE-2026-00001 from 'Received' to 'Resolved'.",
    "current_status": "Received",
    "attempted_status": "Resolved",
    "allowed_transitions": ["Registered"]
  }
}
```
*(The frontend client normalizes both error envelopes into `{ code, message, status, details }`)*

---

## 3. Endpoints Catalog

### 3.1 Authentication

#### `POST /api/v1/auth/login`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Request**:
  ```json
  {
    "email": "admin@aicte-demo.gov.in",
    "password": "demo_password"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer"
    },
    "error": null,
    "metadata": null
  }
  ```

#### `GET /api/v1/auth/me`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>` OR `X-Demo-Role: <ROLE>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "user-admin",
      "email": "admin@aicte-demo.gov.in",
      "full_name": "Smt. Sunita Sharma (Admin)",
      "role": "ADMIN",
      "bureau_id": null,
      "bureau_name": null,
      "bureau_code": null,
      "permissions": [
        "cases:read:all", "cases:create", "cases:update:status",
        "cases:assign", "cases:notes:create", "cases:notes:read:confidential",
        "cases:export", "cases:import", "dashboard:read:all",
        "settings:manage", "audit:read:all"
      ]
    },
    "error": null,
    "metadata": null
  }
  ```

#### `GET /api/v1/auth/switch-demo-role/{role_name}`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Params**: `role_name` ∈ `ADMIN` | `SUPERVISOR` | `OFFICER` | `AUDITOR`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-supervisor",
        "email": "supervisor@aicte-demo.gov.in",
        "full_name": "Dr. Ramesh Chandra (Supervisor)",
        "role": "SUPERVISOR",
        "bureau_id": null
      },
      "token": "eyJhbGciOi..."
    },
    "error": null,
    "metadata": null
  }
  ```
  *(Note: Field name is `token`, distinct from `access_token` in `/login`)*

---

### 3.2 Bureaus & Officers

#### `GET /api/v1/bureaus`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "bureau-appr-id",
        "code": "APPR",
        "name": "Approval Bureau",
        "description": "Monitors institutional compliance with AICTE approval norms, land, building, and faculty ratios.",
        "is_active": true,
        "created_at": "2026-10-24T00:00:00Z"
      },
      {
        "id": "bureau-stu-id",
        "code": "STU",
        "name": "Student Welfare Cell",
        "description": "Addresses grievances regarding ragging, student safety, mental health, and hostel amenities.",
        "is_active": true,
        "created_at": "2026-10-24T00:00:00Z"
      },
      {
        "id": "bureau-fdc-id",
        "code": "FDC",
        "name": "Faculty Grievance Cell",
        "description": "Reviews faculty complaints regarding salary arrears, 7th CPC non-implementation, and termination.",
        "is_active": true,
        "created_at": "2026-10-24T00:00:00Z"
      },
      {
        "id": "bureau-fin-id",
        "code": "FIN",
        "name": "Finance & Fee Regulatory Bureau",
        "description": "Oversees capitation fee complaints, excess tuition demands, and security deposit withholding.",
        "is_active": true,
        "created_at": "2026-10-24T00:00:00Z"
      }
    ],
    "error": null,
    "metadata": null
  }
  ```

#### `GET /api/v1/bureaus/{bureau_id}/officers`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "officer-verma-id",
        "email": "officer.appr@aicte-demo.gov.in",
        "full_name": "Shri Arvind Verma (Officer - Approval)",
        "role": "OFFICER"
      }
    ],
    "error": null,
    "metadata": null
  }
  ```

---

### 3.3 Cases Catalog & Detail

#### `GET /api/v1/cases`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Query Params**:
  - `bureau_id` (optional): string
  - `institution_id` (optional): string
  - `status` (optional): `Received` | `Registered` | `Under Triage` | `Assigned` | `In Progress` | `Awaiting Information` | `Under Review` | `Resolved` | `Closed`
  - `priority` (optional): `LOW` | `MEDIUM` | `HIGH` | `URGENT`
  - `search` (optional): string
  - `sort_by` (optional, default `created_at`): `created_at` | `due_date` | `priority` | `status` | `subject`
  - `sort_dir` (optional, default `desc`): `asc` | `desc`
  - `page` (optional, default 1): integer
  - `page_size` (optional, default 20): integer
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "case-uuid",
        "case_reference_id": "AICTE-2026-00001",
        "institution_id": "inst-uuid",
        "bureau_id": "bureau-appr-id",
        "assigned_officer_id": "officer-uuid",
        "subject": "Faculty shortage below AICTE prescribed ratio",
        "description_redacted": "Institution has 43 faculty against required 62...",
        "description_confidential": "[CONFIDENTIAL COMPLAINANT STATEMENT]...",
        "category": "Faculty Compliance",
        "priority": "HIGH",
        "status": "In Progress",
        "due_date": "2026-11-01T10:00:00Z",
        "escalation_level": 0,
        "closure_remarks": null,
        "created_at": "2026-10-24T00:00:00Z",
        "updated_at": "2026-10-24T06:00:00Z",
        "resolved_at": null,
        "closed_at": null,
        "institution": {
          "id": "inst-uuid",
          "aicte_permanent_id": "1-3324561",
          "name": "Rajasthan Technical University",
          "state": "Rajasthan",
          "district": "Kota",
          "institution_type": "Government"
        },
        "bureau": {
          "id": "bureau-appr-id",
          "code": "APPR",
          "name": "Approval Bureau"
        },
        "assigned_officer": {
          "id": "officer-uuid",
          "email": "officer.appr@aicte-demo.gov.in",
          "full_name": "Shri Arvind Verma",
          "role": "OFFICER"
        }
      }
    ],
    "metadata": {
      "page": 1,
      "page_size": 20,
      "total_records": 58,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
  ```

#### `GET /api/v1/cases/{case_ref}`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Response** (`200 OK`): Single `ComplaintCaseRead` object inside `StandardResponse`. When accessed as AUDITOR, `description_confidential` is redacted to `null`.

---

### 3.4 Lifecycle Mutations

#### `POST /api/v1/cases/{case_ref}/transition`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Request**:
  ```json
  {
    "to_status": "Registered",
    "remarks": "Verified grievance completeness and registered into monitoring system."
  }
  ```
- **Response** (`200 OK`): Updated `ComplaintCaseRead` inside `StandardResponse`.
- **Errors**:
  - `422 Unprocessable Entity`: Missing remarks or illegal transition.

#### `POST /api/v1/cases/{case_ref}/assign`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Request**:
  ```json
  {
    "to_bureau_id": "bureau-appr-id",
    "to_officer_id": "officer-uuid",
    "reason": "Jurisdiction transferred following preliminary assessment."
  }
  ```
- **Response** (`200 OK`): Updated `ComplaintCaseRead` inside `StandardResponse`.

#### `POST /api/v1/cases/{case_ref}/escalate`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Request**:
  ```json
  {
    "reason": "Grievance unresolved after 72 hours; escalated to Tier 1 supervisory surveillance."
  }
  ```
- **Response** (`200 OK`): Updated `ComplaintCaseRead` (with incremented `escalation_level`, max 2).

#### `POST /api/v1/cases/{case_ref}/reopen`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Query Param**: `reason` (min 5 chars)
- **Response** (`200 OK`): Reopened case transitioned back to `In Progress`.

---

### 3.5 Timeline, Notes, and Assignment History

#### `GET /api/v1/cases/{case_ref}/timeline`
- **Status**: ASSUMED endpoint path (audit service is CONFIRMED)
- **Method**: `GET`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "tl-uuid",
        "case_id": "case-uuid",
        "actor_id": "user-uuid",
        "actor_role": "ADMIN",
        "actor_name": "Smt. Sunita Sharma",
        "event_type": "REGISTERED",
        "previous_state": null,
        "new_state": "Received",
        "metadata_json": { "channel": "Web Portal", "batch_id": "INIT-2026" },
        "timestamp": "2026-10-24T00:00:00Z"
      }
    ],
    "error": null,
    "metadata": null
  }
  ```

#### `GET /api/v1/cases/{case_ref}/notes`
- **Status**: ASSUMED endpoint path
- **Method**: `GET`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "note-uuid",
        "case_id": "case-uuid",
        "author_id": "user-uuid",
        "content": "Formal inquiry notice dispatched to Registrar.",
        "is_confidential": false,
        "created_at": "2026-10-24T02:00:00Z",
        "author": {
          "id": "user-uuid",
          "email": "officer.appr@aicte-demo.gov.in",
          "full_name": "Shri Arvind Verma",
          "role": "OFFICER"
        }
      }
    ],
    "error": null,
    "metadata": null
  }
  ```

#### `POST /api/v1/cases/{case_ref}/notes`
- **Status**: ASSUMED endpoint path
- **Method**: `POST`
- **Request**:
  ```json
  {
    "content": "Inspection completed. Awaiting formal compliance response.",
    "is_confidential": false
  }
  ```
- **Response** (`200 OK`): Created `CaseNoteRead` inside `StandardResponse`.

#### `GET /api/v1/cases/{case_ref}/assignment-history`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Response** (`200 OK`): List of `CaseAssignmentHistoryRead` items inside `StandardResponse`.

---

### 3.6 SLA Radar

#### `GET /api/v1/cases/sla-radar`
- **Status**: CONFIRMED
- **Method**: `GET`
- **Query Params**: `bureau_id` (optional)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "total_active_cases": 44,
      "overdue_count": 8,
      "approaching_count": 9,
      "on_track_count": 27,
      "completed_count": 14,
      "overdue_cases": [
        {
          "case_reference_id": "AICTE-2026-00002",
          "subject": "Ragging complaint by first-year B.Tech students",
          "category": "Ragging",
          "priority": "URGENT",
          "status": "In Progress",
          "bureau_code": "STU",
          "bureau_name": "Student Welfare Cell",
          "institution_name": "Rajasthan Technical University",
          "due_date": "2026-10-23T14:00:00Z",
          "escalation_level": 2,
          "sla_status": "OVERDUE",
          "hours_remaining": -20.5,
          "is_overdue": true
        }
      ],
      "approaching_cases": [
        {
          "case_reference_id": "AICTE-2026-00005",
          "subject": "Hostel food hygiene violation",
          "category": "Hostel Facilities",
          "priority": "HIGH",
          "status": "In Progress",
          "bureau_code": "STU",
          "bureau_name": "Student Welfare Cell",
          "institution_name": "Amity University Noida",
          "due_date": "2026-10-25T08:00:00Z",
          "escalation_level": 1,
          "sla_status": "APPROACHING",
          "hours_remaining": 22.0,
          "is_overdue": false
        }
      ]
    },
    "error": null,
    "metadata": null
  }
  ```

---

### 3.7 CSV Ingestion

#### `POST /api/v1/cases/import/preview`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Content-Type**: `multipart/form-data` (form field `file`) OR `application/json` (`{"csv_content": "..."}`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "total_rows": 2,
      "valid_rows": 1,
      "invalid_rows": 1,
      "can_commit": true,
      "rows": [
        {
          "row_number": 2,
          "is_valid": true,
          "institution_aicte_id": "1-3324561",
          "institution_name": "Rajasthan Technical University",
          "bureau_code": "APPR",
          "bureau_name": "Approval Bureau",
          "subject": "Faculty shortage in mechanical dept",
          "category": "Faculty Compliance",
          "priority": "HIGH",
          "is_confidential": false,
          "description": "Shortage of 5 faculty...",
          "errors": [],
          "warnings": [],
          "duplicate_case_ref": null
        },
        {
          "row_number": 3,
          "is_valid": false,
          "institution_aicte_id": "invalid-id",
          "institution_name": null,
          "bureau_code": "UNKNOWN",
          "bureau_name": null,
          "subject": "Missing subject",
          "category": "General",
          "priority": "MEDIUM",
          "is_confidential": false,
          "description": "Details...",
          "errors": [
            { "row_number": 3, "field": "institution_aicte_id", "message": "Invalid format" },
            { "row_number": 3, "field": "bureau_code", "message": "Unknown bureau code" }
          ],
          "warnings": [],
          "duplicate_case_ref": null
        }
      ]
    },
    "error": null,
    "metadata": null
  }
  ```

#### `POST /api/v1/cases/import/commit`
- **Status**: CONFIRMED
- **Method**: `POST`
- **Request**:
  ```json
  {
    "rows": [ ...valid CsvRowPreview objects... ],
    "skip_invalid": true
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "imported_count": 1,
      "skipped_count": 1,
      "failed_count": 0,
      "created_case_references": ["AICTE-2026-1001"]
    },
    "error": null,
    "metadata": null
  }
  ```

---

### 3.8 Dashboard & AI Endpoints (Assumed)

#### `GET /api/v1/cases/dashboard`
- **Status**: ASSUMED (inferred from backend `cases.py` router)
- **Method**: `GET`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "total_cases": 58,
      "active_cases": 44,
      "resolved_cases": 10,
      "closed_cases": 4,
      "overdue_cases": 8,
      "approaching_cases": 9,
      "on_track_cases": 27,
      "resolution_rate": 0.241,
      "bureau_breakdown": [
        {
          "bureau_id": "bureau-appr",
          "bureau_code": "APPR",
          "bureau_name": "Approval Bureau",
          "total": 22,
          "active": 18,
          "overdue": 3,
          "resolved": 4
        }
      ],
      "status_breakdown": [
        { "status": "In Progress", "count": 14 }
      ],
      "priority_breakdown": [
        { "priority": "HIGH", "count": 20 }
      ]
    },
    "error": null,
    "metadata": null
  }
  ```

#### `POST /api/v1/ai/triage`
- **Status**: ASSUMED
- **Method**: `POST`
- **Request**: `{ "text": "Ragging incident in hostel block B" }`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "recommended_bureau_code": "STU",
      "recommended_bureau_name": "Student Welfare Cell",
      "recommended_category": "Student Grievance",
      "recommended_priority": "URGENT",
      "confidence": 0.92,
      "matched_keywords": [
        { "keyword": "ragging", "weight": 0.6, "resulting_route": "STU / Student Grievance" },
        { "keyword": "hostel", "weight": 0.4, "resulting_route": "STU / Student Grievance" }
      ],
      "rationale": "Matched keywords pointing to Student Welfare Cell."
    },
    "error": null,
    "metadata": null
  }
  ```

#### `POST /api/v1/ai/duplicates`
- **Status**: ASSUMED
- **Method**: `POST`
- **Request**:
  ```json
  {
    "subject": "Hostel water shortage",
    "description": "No drinking water available for 3 days in girls hostel",
    "institution_name": "Amity University"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "matches": [
        {
          "case_reference_id": "AICTE-2026-00010",
          "subject": "Hostel water supply disruption",
          "institution_name": "Amity University Noida",
          "status": "In Progress",
          "similarity_score": 0.84,
          "matched_keywords": ["hostel", "water", "shortage"]
        }
      ]
    },
    "error": null,
    "metadata": null
  }
  ```
