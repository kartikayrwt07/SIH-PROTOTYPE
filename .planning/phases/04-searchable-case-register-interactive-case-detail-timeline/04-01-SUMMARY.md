# Plan Summary: 04-01 Searchable Case Register & SLA Badges

**Phase**: 04-searchable-case-register-interactive-case-detail-timeline
**Plan**: 01
**Status**: Completed
**Execution Wave**: 1
**Automated Tests**: 6 passed (`backend/tests/test_case_api.py`), Frontend build succeeded (`tsc && vite build`)

---

## 1. Objectives & Achievements
- **Multi-Parameter Search & Joined SQL Filtering**:
  - Enhanced `GET /api/v1/cases` with an outer join to `Institution`, permitting full-text searching across subject, case reference ID, category, and institution name.
  - Implemented dynamic sorting supporting `created_at`, `due_date`, `priority`, `status`, and `subject` in ascending and descending directions.
  - Added dedicated `institution_id` filtering alongside status, priority, and bureau scoping.
- **Dynamic SlaBadge Component (`SlaBadge.tsx`)**:
  - Dynamically computes hours and days remaining against target deadline `due_date`.
  - Accurately classifies status into "Overdue" (crimson), "Approaching Deadline" (< 48h, warning amber), "On Track" (> 48h, sage green), and "Met / Completed" (for resolved/closed cases).
  - Features accessible tooltips and aria-labels indicating exact target timestamps in Indian Standard Time (`en-IN`).
- **High-Density Responsive Case Register (`CaseRegister.tsx`)**:
  - Interactive toolbar with debounced keyword search, status dropdown, priority dropdown, bureau dropdown, sorting controls, and instant filter reset.
  - Accessible data table displaying Case Reference, Institution profile, Subject & Category, Bureau badge, Priority chip, Status badge, SLA urgency countdown, and "Inspect" button.
  - Full server-side pagination with rows-per-page selection and record counters.

---

## 2. Key Files Delivered
- `backend/app/api/v1/cases.py`: Enhanced `list_cases` with institution joins, multi-parameter search, and dynamic sorting.
- `backend/app/api/v1/bureaus.py` & `router.py`: `GET /api/v1/bureaus` endpoint for dynamic bureau filter population.
- `frontend/src/types/index.ts`: Extended with `CaseFilterParams`, `CaseNote`, and `SlaRiskLevel`.
- `frontend/src/services/api.ts`: Added `getBureaus()`, typed `getCases(params)`, `getCaseNotes`, and `addCaseNote`.
- `frontend/src/components/common/SlaBadge.tsx`: Reusable urgency badge component with real-time countdown calculations.
- `frontend/src/components/cases/CaseRegister.tsx`: High-performance case register catalog with pagination and filters.

---

## 3. Verification Evidence
- Automated test command: `python -m pytest backend/tests/test_case_api.py -k "test_search_by_institution_and_sorting" -v`
- Result: Passed with multi-field search and sort assertions confirmed.
- Frontend bundle compilation: `npm run build` in `frontend/` (0 errors, 4.35s).
