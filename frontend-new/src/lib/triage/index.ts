/**
 * Rule-based Explainable Smart Triage & Duplicate Intelligence.
 *
 * Implements:
 * 1. Multi-factor keyword routing with explainable weights summing to 100%.
 * 2. Tokenized Jaccard text similarity with institution affinity boosting.
 * 3. Client/Mock execution that matches the backend AI API contract.
 */

import type {
  BureauCode,
  CasePriority,
  DuplicateMatch,
  TriageResult,
  ComplaintCase,
} from "@/types/ui";

// ─── Keyword routing table ────────────────────────────────────────────────────

interface KeywordRule {
  keywords: string[];
  bureau: BureauCode;
  category: string;
  priority: CasePriority;
  weight: number;
}

export const KEYWORD_RULES: KeywordRule[] = [
  // APPR — Approval Bureau
  {
    keywords: [
      "approval",
      "compliance",
      "land",
      "building",
      "faculty ratio",
      "faculty-student ratio",
      "nba",
      "noc",
      "affiliation",
      "infrastructure",
      "laboratory",
      "intake capacity",
      "unapproved course",
    ],
    bureau: "APPR",
    category: "Approval Compliance",
    priority: "HIGH",
    weight: 0.9,
  },
  // STU — Student Welfare Cell
  {
    keywords: [
      "ragging",
      "hostel",
      "student",
      "mental health",
      "safety",
      "scholarship",
      "fee refund",
      "mess",
      "harassment",
      "student welfare",
      "counseling",
      "amenities",
    ],
    bureau: "STU",
    category: "Student Grievance",
    priority: "URGENT",
    weight: 0.95,
  },
  // FDC — Faculty Grievance Cell
  {
    keywords: [
      "salary",
      "faculty",
      "teacher",
      "arrear",
      "7th cpc",
      "termination",
      "pf",
      "provident fund",
      "leave",
      "pay commission",
      "unpaid wages",
      "gratuity",
    ],
    bureau: "FDC",
    category: "Faculty Grievance",
    priority: "HIGH",
    weight: 0.88,
  },
  // FIN — Finance & Fee Regulatory Bureau
  {
    keywords: [
      "capitation",
      "tuition",
      "fee",
      "deposit",
      "refund",
      "excess charge",
      "finance",
      "overcharging",
      "caution deposit",
      "withholding certificate",
      "mandatory donation",
    ],
    bureau: "FIN",
    category: "Fee Regulation",
    priority: "MEDIUM",
    weight: 0.85,
  },
];

const BUREAU_NAMES: Record<BureauCode, string> = {
  APPR: "Approval Bureau",
  STU: "Student Welfare Cell",
  FDC: "Faculty Grievance Cell",
  FIN: "Finance & Fee Regulatory Bureau",
};

// ─── Triage ───────────────────────────────────────────────────────────────────

/**
 * Rule-based explainable triage: matches grievance text against keyword rules
 * and returns recommended bureau, category, priority, confidence score,
 * and an explainable list of matched keyword weights that sum to 100%.
 */
export function runTriageRule(text: string): TriageResult {
  const lower = text.toLowerCase();

  let bestRule: KeywordRule | null = null;
  let bestScore = 0;
  const rawMatches: { keyword: string; weight: number; resulting_route: string }[] = [];

  for (const rule of KEYWORD_RULES) {
    const hits = rule.keywords.filter((kw) => lower.includes(kw));
    if (hits.length === 0) continue;

    const matchRatio = hits.length / Math.min(rule.keywords.length, 5);
    const score = matchRatio * rule.weight;

    hits.forEach((kw) => {
      rawMatches.push({
        keyword: kw,
        weight: rule.weight,
        resulting_route: `${rule.bureau} · ${BUREAU_NAMES[rule.bureau]}`,
      });
    });

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (!bestRule || rawMatches.length === 0) {
    return {
      recommended_bureau_code: "APPR",
      recommended_bureau_name: "Approval Bureau",
      recommended_category: "General Complaint",
      recommended_priority: "MEDIUM",
      confidence: 0.25,
      matched_keywords: [],
      rationale: "No statutory keywords matched. Routed to Approval Bureau for manual assessment.",
    };
  }

  // Normalise keyword weights so they sum exactly to 1.0 (100%)
  const totalRawWeight = rawMatches.reduce((sum, item) => sum + item.weight, 0);
  const normalisedKeywords = rawMatches.map((item) => ({
    keyword: item.keyword,
    weight: parseFloat((item.weight / (totalRawWeight || 1)).toFixed(2)),
    resulting_route: item.resulting_route,
  }));

  // Re-adjust last element to guarantee sum is exactly 1.00
  if (normalisedKeywords.length > 0) {
    const currentSum = normalisedKeywords.reduce((sum, item) => sum + item.weight, 0);
    const diff = parseFloat((1 - currentSum).toFixed(2));
    if (diff !== 0) {
      normalisedKeywords[0].weight = parseFloat((normalisedKeywords[0].weight + diff).toFixed(2));
    }
  }

  // Confidence calculation (capped at 0.98)
  const confidence = parseFloat(Math.min(0.6 + bestScore * 0.4, 0.98).toFixed(2));

  return {
    recommended_bureau_code: bestRule.bureau,
    recommended_bureau_name: BUREAU_NAMES[bestRule.bureau],
    recommended_category: bestRule.category,
    recommended_priority: bestRule.priority,
    confidence,
    matched_keywords: normalisedKeywords,
    rationale: `Matched ${rawMatches.length} statutory keyword(s) with highest correlation to ${BUREAU_NAMES[bestRule.bureau]}.`,
  };
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

/** Tokenise text into lowercase alphanumeric words, filtering standard English stop words. */
function tokenise(text: string): string[] {
  const STOP = new Set([
    "the", "a", "an", "is", "in", "of", "and", "or", "to", "for",
    "with", "at", "by", "from", "on", "it", "this", "that", "be", "as", "are", "has", "have", "had",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Jaccard similarity between two token sets. */
function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((t) => setB.has(t));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}

/**
 * Check for duplicate or highly similar cases against the repository.
 * Employs tokenised Jaccard overlap + institution affinity boost.
 */
export function checkDuplicatesRule(
  query: { subject: string; description: string; institution_name?: string },
  cases: ComplaintCase[],
  threshold = 0.2,
): DuplicateMatch[] {
  const queryTokens = tokenise(`${query.subject} ${query.description}`);
  if (queryTokens.length === 0) return [];

  const matches: DuplicateMatch[] = [];

  for (const c of cases) {
    const caseTokens = tokenise(`${c.subject} ${c.description_redacted}`);
    let score = jaccard(queryTokens, caseTokens);

    // Boost score if institution name matches or overlaps
    if (
      query.institution_name &&
      c.institution_name &&
      (c.institution_name.toLowerCase().includes(query.institution_name.toLowerCase()) ||
       query.institution_name.toLowerCase().includes(c.institution_name.toLowerCase()))
    ) {
      score = Math.min(score + 0.15, 0.96);
    }

    if (score < threshold) continue;

    const intersection = caseTokens.filter((t) => new Set(queryTokens).has(t));
    const uniqueKeywords = [...new Set(intersection)].slice(0, 5);

    matches.push({
      case_reference_id: c.case_reference_id,
      subject: c.subject,
      institution_name: c.institution_name,
      status: c.status,
      similarity_score: parseFloat(score.toFixed(2)),
      matched_keywords: uniqueKeywords.length > 0 ? uniqueKeywords : queryTokens.slice(0, 3),
    });
  }

  return matches.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 6);
}
