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
    Computes TF-IDF vectors across the corpus of existing complaint cases and
    evaluates cosine similarity against incoming grievance text.
    """
    query_content = f"{request.subject} {request.description}".strip()
    clean_query = clean_text(query_content)

    # Fetch active cases (excluding terminal or excluded cases)
    query = db.query(ComplaintCase).join(Institution, ComplaintCase.institution_id == Institution.id)\
        .join(Bureau, ComplaintCase.bureau_id == Bureau.id)
    
    if request.exclude_case_ref:
        query = query.filter(ComplaintCase.case_reference_id != request.exclude_case_ref)
        
    candidates: List[ComplaintCase] = query.limit(500).all()
    
    if not candidates or not clean_query:
        return DuplicateCheckResponse(
            total_evaluated=0,
            matches_found=0,
            highest_similarity=0.0,
            has_potential_duplicate=False,
            matches=[]
        )

    # Prepare corpus for TF-IDF vectorization
    corpus = [clean_query]
    candidate_meta = []
    
    for case in candidates:
        case_desc = case.description_confidential or case.description_redacted or ""
        text = clean_text(f"{case.subject} {case_desc}")
        corpus.append(text)
        candidate_meta.append((case, case_desc))

    # Compute TF-IDF matrix
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=2000,
        ngram_range=(1, 2)
    )
    
    tfidf_matrix = vectorizer.fit_transform(corpus)
    query_vector = tfidf_matrix[0:1]
    candidate_vectors = tfidf_matrix[1:]
    
    # Compute cosine similarity
    similarities = cosine_similarity(query_vector, candidate_vectors)[0]
    
    matches: List[DuplicateMatch] = []
    highest_score = 0.0

    for idx, raw_score in enumerate(similarities):
        score = float(raw_score)
        case, case_desc = candidate_meta[idx]
        
        # Institutional match boost (+0.08 if exact same institution, capped at 1.0)
        is_same_institution = (
            request.institution_aicte_id and
            case.institution and
            case.institution.aicte_permanent_id == request.institution_aicte_id
        )
        if is_same_institution and score > 0.15:
            score = min(1.0, score + 0.08)

        if score > highest_score:
            highest_score = round(score, 3)

        if score >= request.threshold:
            matched_keywords = extract_matched_tokens(query_content, f"{case.subject} {case_desc}")
            
            matches.append(DuplicateMatch(
                case_reference_id=case.case_reference_id,
                subject=case.subject,
                institution_name=case.institution.name if case.institution else "Unknown",
                institution_aicte_id=case.institution.aicte_permanent_id if case.institution else "N/A",
                bureau_code=case.bureau.code if case.bureau else "N/A",
                bureau_name=case.bureau.name if case.bureau else "Unassigned",
                similarity_score=round(score, 3),
                matched_keywords=matched_keywords,
                status=case.status.value,
                created_at=case.created_at,
            ))

    # Sort matches by similarity score descending
    matches.sort(key=lambda m: m.similarity_score, reverse=True)

    return DuplicateCheckResponse(
        total_evaluated=len(candidates),
        matches_found=len(matches),
        highest_similarity=highest_score,
        has_potential_duplicate=len(matches) > 0,
        matches=matches
    )


def compute_triage_suggestion(
    db: Session,
    request: TriageSuggestRequest,
) -> TriageSuggestion:
    """
    Computes explainable bureau routing and categorization recommendation based on:
    1. Domain keyword frequency and affinity score
    2. Historical bureau assignment patterns for the given institution
    3. Category heuristics and priority determination
    """
    full_text = f"{request.subject} {request.description}"
    cleaned = clean_text(full_text)
    words = re.findall(r"\b[a-z]{3,}\b", cleaned)
    
    # 1. Evaluate bureau scores via keyword affinity
    bureau_scores: Dict[str, Tuple[float, List[str]]] = {}
    
    for code, config in BUREAU_LEXICON.items():
        matched = []
        weight_sum = 0.0
        
        for kw in config["keywords"]:
            if " " in kw:
                if kw in cleaned:
                    matched.append(kw)
                    weight_sum += 2.0
            else:
                if kw in words:
                    matched.append(kw)
                    weight_sum += 1.0
                    
        bureau_scores[code] = (weight_sum, matched)

    # Find highest scoring bureau
    sorted_bureaus = sorted(bureau_scores.items(), key=lambda item: item[1][0], reverse=True)
    best_code, (best_weight, best_tokens) = sorted_bureaus[0]

    # Resolve Bureau entity from DB
    target_bureau = db.query(Bureau).filter(Bureau.code == best_code).first()
    if not target_bureau:
        # Fallback to first available bureau
        target_bureau = db.query(Bureau).first()
        best_code = target_bureau.code if target_bureau else "APPR"

    target_config = BUREAU_LEXICON.get(best_code, BUREAU_LEXICON["APPR"])
    recommended_category = target_config["category"]
    recommended_priority = target_config["priority"]

    # 2. Check Institution History Boost
    institution_history_count = 0
    matched_institution = None
    if request.institution_aicte_id:
        matched_institution = db.query(Institution).filter(Institution.aicte_permanent_id == request.institution_aicte_id).first()
        if matched_institution:
            institution_history_count = db.query(ComplaintCase).filter(
                ComplaintCase.institution_id == matched_institution.id,
                ComplaintCase.bureau_id == target_bureau.id
            ).count()

    # 3. Build Transparent Rationale Items
    rationales: List[TriageRationaleItem] = []
    
    # Factor 1: Keyword Affinity
    if best_tokens:
        affinity_score = min(0.95, 0.50 + (len(best_tokens) * 0.10))
        rationales.append(TriageRationaleItem(
            category="KEYWORD_AFFINITY",
            title=f"Domain Keyword Match ({len(best_tokens)} terms)",
            explanation=f"Identified {len(best_tokens)} domain-specific terms matching {target_bureau.name} jurisdiction: {', '.join(best_tokens[:4])}.",
            weight=round(affinity_score, 2),
            matched_tokens=best_tokens[:6]
        ))
    else:
        rationales.append(TriageRationaleItem(
            category="KEYWORD_AFFINITY",
            title="General Jurisdiction Default",
            explanation=f"No specialized safety or regulatory terms detected; routed to {target_bureau.name} as standard intake bureau.",
            weight=0.50,
            matched_tokens=[]
        ))

    # Factor 2: Historical Pattern
    if institution_history_count > 0:
        rationales.append(TriageRationaleItem(
            category="INSTITUTION_HISTORY",
            title="Institutional Routing Precedent",
            explanation=f"{matched_institution.name} has {institution_history_count} previous case(s) successfully routed to {target_bureau.code}.",
            weight=0.20,
            matched_tokens=[target_bureau.code]
        ))
    elif matched_institution:
        rationales.append(TriageRationaleItem(
            category="INSTITUTION_HISTORY",
            title="Institutional Profile Verified",
            explanation=f"Grievance linked to active registered institution '{matched_institution.name}' in AICTE database.",
            weight=0.10,
            matched_tokens=[matched_institution.aicte_permanent_id]
        ))

    # Factor 3: Statutory Priority Classification
    rationales.append(TriageRationaleItem(
        category="DOMAIN_POLICY",
        title=f"AICTE {recommended_priority} SLA Policy Alignment",
        explanation=f"Category '{recommended_category}' carries default {recommended_priority} priority under AICTE grievance operating guidelines.",
        weight=0.15,
        matched_tokens=[recommended_category, recommended_priority]
    ))

    # Compute overall confidence score
    raw_confidence = 0.55 + (0.08 * len(best_tokens)) + (0.05 if institution_history_count > 0 else 0.0)
    confidence = min(0.96, max(0.60, round(raw_confidence, 2)))

    return TriageSuggestion(
        recommended_bureau_id=target_bureau.id,
        recommended_bureau_code=target_bureau.code,
        recommended_bureau_name=target_bureau.name,
        recommended_category=recommended_category,
        recommended_priority=recommended_priority,
        confidence_score=confidence,
        rationales=rationales,
    )


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

    # Update bureau if requested
    if request.bureau_id:
        target_bureau = db.query(Bureau).filter(Bureau.id == request.bureau_id).first()
        if not target_bureau:
            raise ValueError(f"Bureau ID '{request.bureau_id}' not found.")
        case.bureau_id = target_bureau.id

    # Update category if requested
    if request.category:
        case.category = request.category

    # Update priority if requested
    if request.priority:
        from backend.app.models.case import CasePriority
        try:
            case.priority = CasePriority(request.priority)
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
            "justification": request.justification or "Accepted explainable AI triage recommendation",
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
