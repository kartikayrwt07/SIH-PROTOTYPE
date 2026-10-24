/**
 * ASSUMED SHAPES: verify against backend.
 *
 * These types describe endpoints or response fields that were not confirmed
 * by live curl responses during Step 0 (the DB was not seeded). They are
 * based on reading backend source code. Mark with @assumed JSDoc tag so
 * they are easy to grep.
 *
 * Once the DB is seeded and live responses are verified, move confirmed
 * shapes to src/types/api.ts and remove them from here.
 */

/**
 * @assumed Dashboard stats endpoint response.
 * Backend has GET /api/v1/cases/dashboard — shape inferred from cases.py code.
 */
export interface AssumedDashboardStatsRaw {
  total_cases: number;
  active_cases: number;
  resolved_cases: number;
  closed_cases: number;
  overdue_cases: number;
  approaching_cases: number;
  on_track_cases: number;
  bureau_breakdown: Array<{
    bureau_id: string;
    bureau_code: string;
    bureau_name: string;
    total: number;
    active: number;
    overdue: number;
    resolved: number;
  }>;
  status_breakdown: Array<{ status: string; count: number }>;
  priority_breakdown: Array<{ priority: string; count: number }>;
}

/**
 * @assumed AI triage endpoint — GET /api/v1/ai/triage
 * Backend has an ai.py module; triage output shape is not confirmed.
 */
export interface AssumedTriageRaw {
  recommended_bureau_code: string;
  recommended_bureau_name: string;
  recommended_category: string;
  recommended_priority: string;
  confidence: number;
  matched_keywords: Array<{
    keyword: string;
    weight: number;
    resulting_route: string;
  }>;
  rationale: string;
}

/**
 * @assumed Duplicate detection endpoint — GET /api/v1/ai/duplicates
 * Expected shape based on SPEC §6 (Smart Triage screen).
 */
export interface AssumedDuplicateDetectionRaw {
  matches: Array<{
    case_reference_id: string;
    subject: string;
    institution_name: string;
    status: string;
    similarity_score: number;
    matched_keywords: string[];
  }>;
}
