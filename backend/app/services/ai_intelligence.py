"""
Deterministic, Explainable AI Intelligence Service.
Provides TF-IDF duplicate complaint detection, smart bureau triage recommendations,
and transparent rationale breakdowns with human-in-the-loop decision gating.
"""

import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.audit import CaseAuditEvent, AuditEventType
from backend.app.schemas.ai import (
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    DuplicateMatch,
    TriageSuggestRequest,
    TriageSuggestion,
    TriageRationaleItem,
    TriageApplyRequest,
    TriageApplyResponse,
)

# Bureau Domain Heuristics Lexicon aligned with AICTE Bureau Codes:
# STU = Student Welfare Cell (Ragging, Hostel, Student Safety)
# FIN = Finance & Fee Regulatory Bureau (Capitation Fee, Overcharging, Refund)
# APPR = Approval Bureau (Unapproved Courses, Infrastructure Norms, Approvals)
# FDC = Faculty Grievance Cell (Faculty Shortage, Unpaid Salary, Qualification)

BUREAU_LEXICON: Dict[str, Dict] = {
    "STU": {
        "keywords": [
            "ragging", "hostel", "warden", "senior", "seniors", "intimidation",
            "physical abuse", "mental harassment", "threat", "threats", "hazing",
            "fresher", "freshers", "humiliation", "curfew", "dormitory", "dorm",
            "mess", "night", "campus security", "bullying", "suicide"
        ],
        "category": "Ragging Allegation",
        "priority": "URGENT",
        "description": "Student safety, anti-ragging compliance, and campus intimidation"
    },
    "FIN": {
        "keywords": [
            "fee", "fees", "surcharge", "capitation", "refund", "overcharging",
            "receipt", "financial", "donation", "building fund", "tuition",
            "unapproved fee", "seat matrix", "admission quota", "caution money",
            "illegal fee", "accounts", "deposit", "extortion", "excess fee"
        ],
        "category": "Fee & Financial Irregularities",
        "priority": "HIGH",
        "description": "Financial compliance, unapproved fees, and fee refunds"
    },
    "APPR": {
        "keywords": [
            "unapproved", "approval", "infrastructure", "laboratory", "equipment",
            "shortage", "sanctioned", "accreditation", "affiliation", "norms",
            "deficiency", "land", "building", "inspection", "unauthorized course",
            "curriculum", "syllabus", "internship"
        ],
        "category": "Curriculum & Exam Irregularities",
        "priority": "HIGH",
        "description": "Approval compliance, infrastructure norms, and course validity"
    },
    "FDC": {
        "keywords": [
            "faculty", "salary", "pay scale", "professor", "professors", "qualification",
            "recruitment", "promotion", "termination", "delay", "unpaid", "provident fund",
            "arrears", "teaching", "teacher", "teachers", "phd", "ugc"
        ],
        "category": "Faculty Shortage & Qualification",
        "priority": "MEDIUM",
        "description": "Faculty service conditions, qualifications, and salary grievances"
    }
}


def clean_text(text: str) -> str:
    """Preprocesses text for NLP matching: lowercase, strip punctuation, normalize spaces."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_matched_tokens(query_text: str, candidate_text: str, top_n: int = 5) -> List[str]:
    """Extracts salient overlapping words/tokens between two texts."""
    q_words = set(re.findall(r"\b[a-z]{3,}\b", clean_text(query_text)))
    c_words = set(re.findall(r"\b[a-z]{3,}\b", clean_text(candidate_text)))
    
    # Exclude common stopwords
    common_stops = {
        "the", "and", "for", "with", "that", "this", "from", "have", "were",
        "been", "student", "college", "institute", "complaint", "regarding",
        "without", "under", "about", "aicte", "case", "action"
    }
    overlap = (q_words & c_words) - common_stops
    return sorted(list(overlap))[:top_n]


def check_duplicate_complaints(
    db: Session,
    request: DuplicateCheckRequest,
) -> DuplicateCheckResponse:
    """
    Evaluates cosine similarity against incoming grievance text using the
    high-throughput pre-computed VectorIndexCache engine.
    """
    from backend.app.services.vector_cache import vector_index
    return vector_index.query_similarity(db, request)



def compute_triage_suggestion(
    db: Session,
    request: TriageSuggestRequest,
) -> TriageSuggestion:
    """
    Computes explainable bureau routing and categorization recommendation using
    the production-grade zero-shot semantic embedding classifier.
    """
    from backend.app.services.triage_classifier import semantic_triage_classifier
    return semantic_triage_classifier.classify_and_suggest(db, request)


def apply_triage_suggestion(
    db: Session,
    request: TriageApplyRequest,
    actor_email: str = "supervisor@aicte-demo.gov.in"
) -> TriageApplyResponse:
    """
    Enforces Human-in-the-Loop decision execution:
    Explicitly applies recommended bureau/category/priority to a case and
    creates an immutable CaseAuditEvent tracking the human approval.
    """
    case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == request.case_reference_id).first()
    if not case:
        raise ValueError(f"Complaint case '{request.case_reference_id}' not found.")

    old_bureau = case.bureau.code if case.bureau else "None"
    old_category = case.category
    old_priority = case.priority.value if case.priority else "None"

    # Resolve bureau by ID or Code (supporting both backend ID and frontend bureau_code aliases)
    bureau_id = request.bureau_id
    bureau_code = request.target_bureau_code or request.bureau_code
    if bureau_id:
        target_bureau = db.query(Bureau).filter(Bureau.id == bureau_id).first()
        if not target_bureau:
            raise ValueError(f"Bureau ID '{bureau_id}' not found.")
        case.bureau_id = target_bureau.id
    elif bureau_code:
        target_bureau = db.query(Bureau).filter(Bureau.code == bureau_code).first()
        if not target_bureau:
            raise ValueError(f"Bureau with code '{bureau_code}' not found.")
        case.bureau_id = target_bureau.id

    # Update category if requested (supporting both category and target_category)
    new_category = request.target_category or request.category
    if new_category:
        case.category = new_category

    # Update priority if requested (supporting both priority and target_priority)
    new_priority = request.target_priority or request.priority
    if new_priority:
        from backend.app.models.case import CasePriority
        try:
            case.priority = CasePriority(new_priority)
        except ValueError:
            pass

    # If case was in "Received" state, transition to "Under Triage" or "Assigned"
    if case.status == CaseStatus.RECEIVED:
        case.status = CaseStatus.ASSIGNED

    # Create immutable audit log
    audit_event = CaseAuditEvent(
        case_id=case.id,
        actor_id=None,
        actor_role="SUPERVISOR",
        event_type=AuditEventType.REASSIGNED,
        previous_state=f"Bureau: {old_bureau}, Category: {old_category}, Priority: {old_priority}",
        new_state=f"Bureau: {case.bureau.code}, Category: {case.category}, Priority: {case.priority.value}",
        metadata_json={
            "action": "AI_RECOMMENDATION_ACCEPTED",
            "justification": request.officer_rationale or request.justification or "Accepted explainable AI triage recommendation",
            "actor_email": actor_email,
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit_event)
    db.commit()
    db.refresh(case)
    db.refresh(audit_event)

    return TriageApplyResponse(
        case_reference_id=case.case_reference_id,
        bureau_code=case.bureau.code,
        bureau_name=case.bureau.name,
        category=case.category,
        priority=case.priority.value,
        status=case.status.value,
        audit_event_id=audit_event.id,
        applied_at=audit_event.timestamp,
    )
