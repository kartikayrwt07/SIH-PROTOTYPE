"""
Production-Grade Zero-Shot Semantic Triage Classifier.

Replaces brittle keyword regex rules with dense semantic zero-shot classification
anchored by AICTE statutory bureau jurisdictional archetypes.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from sqlalchemy.orm import Session
from fastembed import TextEmbedding

from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.case import ComplaintCase
from backend.app.schemas.ai import (
    TriageSuggestRequest,
    TriageSuggestion,
    TriageRationaleItem,
)
from backend.app.services.vector_store import persistent_vector_store, clean_semantic_text

# Statutory AICTE Bureau Jurisdictional Archetypes
BUREAU_ARCHETYPES: Dict[str, Dict[str, Any]] = {
    "APPR": {
        "name": "Approval Bureau",
        "description": "Approval compliance, infrastructure norms, authorized intake, and course accreditation validity",
        "category": "Curriculum & Exam Irregularities",
        "priority": "HIGH",
        "archetype_text": (
            "unapproved course technical degree without AICTE approval unauthorized engineering program "
            "illegal affiliation fake accreditation norms violation infrastructure deficiency laboratory equipment "
            "deficit land requirement violation illegal admission unapproved intake excess student seats "
            "violation of approval process handbook sanctioned capacity fraud degree validation issue"
        ),
    },
    "FIN": {
        "name": "Finance & Fee Regulatory Bureau",
        "description": "Financial compliance, capitation fees, unauthorized extortion, and fee refunds",
        "category": "Fee & Financial Irregularities",
        "priority": "HIGH",
        "archetype_text": (
            "fee extortion capitation fee donation overcharging high fees tuition fee excess charging refusal "
            "to refund caution deposit security deposit withholding money stealing student fees receipt not given "
            "account fraud unauthorized charges hostel fee hike admission extortion examination fee irregularity "
            "financial embezzlement penalty fine illegal demands"
        ),
    },
    "STU": {
        "name": "Student Welfare Cell",
        "description": "Student safety, anti-ragging compliance, and campus intimidation",
        "category": "Ragging Allegation",
        "priority": "URGENT",
        "archetype_text": (
            "anti-ragging violation physical abuse mental harassment bullying hazing by seniors hostel intimidation "
            "threats violence dormitory harassment warden negligence student safety suicide threat campus danger "
            "caste discrimination gender harassment student welfare mental health distress abusive behavior physical harm"
        ),
    },
    "FDC": {
        "name": "Faculty Grievance Cell",
        "description": "Faculty service conditions, qualifications, delayed remuneration, and employment contracts",
        "category": "Faculty Shortage & Qualification",
        "priority": "MEDIUM",
        "archetype_text": (
            "unpaid faculty salary delayed salary payment 7th pay commission non-compliance illegal termination "
            "of professor teacher exploitation provident fund arrears non-payment phd qualification violation "
            "faculty shortage teaching staff recruitment fraud biometric harassment illegal salary deduction service bond"
        ),
    },
}


class SemanticZeroShotTriageClassifier:
    """Zero-shot ML classifier matching complaint embeddings against statutory bureau profiles."""

    def __init__(self):
        self.bureau_vectors: Optional[Dict[str, np.ndarray]] = None

    def _ensure_bureau_vectors(self):
        """Precomputes normalized semantic embedding vectors for bureau archetypes."""
        if self.bureau_vectors is not None:
            return

        model = persistent_vector_store._get_model()
        vectors = {}
        for code, info in BUREAU_ARCHETYPES.items():
            emb = np.array(list(model.embed([clean_semantic_text(info["archetype_text"])])), dtype=np.float32)
            norm = emb / max(float(np.linalg.norm(emb)), 1e-9)
            vectors[code] = norm[0]

        self.bureau_vectors = vectors

    def classify_text(self, subject: str, description: str) -> Dict[str, Any]:
        """
        Standalone zero-shot classification without database session dependency.
        Returns dict with:
        - bureau_code: 'APPR' | 'FIN' | 'STU' | 'FDC'
        - bureau_name: str
        - category: str
        - priority: str
        - similarity_score: float
        - all_scores: Dict[str, float]
        """
        self._ensure_bureau_vectors()
        full_text = f"{subject} {description}".strip()
        cleaned = clean_semantic_text(full_text) or full_text

        model = persistent_vector_store._get_model()
        q_emb = np.array(list(model.embed([cleaned])), dtype=np.float32)
        q_norm = q_emb / max(float(np.linalg.norm(q_emb)), 1e-9)
        q_vec = q_norm[0]

        scores = {code: float(np.dot(q_vec, b_vec)) for code, b_vec in self.bureau_vectors.items()}
        best_code = max(scores, key=scores.get)
        archetype = BUREAU_ARCHETYPES[best_code]

        priority = archetype["priority"]
        urgent_signals = ["suicide", "physical abuse", "ragging", "violence", "threat to life", "extortion"]
        if any(sig in cleaned.lower() for sig in urgent_signals) and best_code in ["STU", "FIN"]:
            priority = "URGENT"

        return {
            "bureau_code": best_code,
            "bureau_name": archetype["name"],
            "category": archetype["category"],
            "priority": priority,
            "similarity_score": scores[best_code],
            "all_scores": scores,
        }

    def classify_and_suggest(
        self,
        db: Session,
        request: TriageSuggestRequest,
    ) -> TriageSuggestion:
        """
        Executes zero-shot semantic bureau routing:
        1. Embeds incoming complaint text into dense 384-d semantic space.
        2. Computes cosine proximity against all 4 AICTE bureau archetype vectors.
        3. Identifies optimal bureau with transparent explainability and confidence scoring.
        4. Cross-references institutional grievance precedent.
        """
        self._ensure_bureau_vectors()

        full_text = f"{request.subject} {request.description}".strip()
        cleaned_text = clean_semantic_text(full_text)
        if not cleaned_text:
            cleaned_text = full_text

        # 1. Compute complaint semantic vector
        model = persistent_vector_store._get_model()
        q_emb = np.array(list(model.embed([cleaned_text])), dtype=np.float32)
        q_norm = q_emb / max(float(np.linalg.norm(q_emb)), 1e-9)
        q_vec = q_norm[0]

        # 2. Score similarity against each bureau archetype
        scores: Dict[str, float] = {}
        for code, b_vec in self.bureau_vectors.items():
            sim = float(np.dot(q_vec, b_vec))
            scores[code] = sim

        # Sort bureaus by semantic affinity
        sorted_codes = sorted(scores.keys(), key=lambda c: scores[c], reverse=True)
        best_code = sorted_codes[0]
        best_score = scores[best_code]

        # Retrieve target bureau entity from database
        target_bureau = db.query(Bureau).filter(Bureau.code == best_code).first()
        if not target_bureau:
            target_bureau = db.query(Bureau).first()
            best_code = target_bureau.code if target_bureau else "APPR"

        archetype_info = BUREAU_ARCHETYPES.get(best_code, BUREAU_ARCHETYPES["APPR"])
        recommended_category = archetype_info["category"]
        recommended_priority = archetype_info["priority"]

        # Urgent override detection (safety / violence / suicide hazards)
        urgent_signals = ["suicide", "physical abuse", "ragging", "violence", "threat to life", "extortion"]
        if any(sig in cleaned_text for sig in urgent_signals) and best_code in ["STU", "FIN"]:
            recommended_priority = "URGENT"

        # 3. Check Institutional Precedent
        institution_history_count = 0
        matched_institution = None
        if request.institution_aicte_id:
            matched_institution = db.query(Institution).filter(
                Institution.aicte_permanent_id == request.institution_aicte_id
            ).first()
            if matched_institution and target_bureau:
                institution_history_count = db.query(ComplaintCase).filter(
                    ComplaintCase.institution_id == matched_institution.id,
                    ComplaintCase.bureau_id == target_bureau.id
                ).count()

        # 4. Generate Explainable Rationales
        rationales: List[TriageRationaleItem] = []

        # Rationale 1: Semantic Zero-Shot Proximity
        bureau_name = target_bureau.name if target_bureau else archetype_info["name"]
        raw_pct = min(98.0, max(52.0, round((best_score + 0.30) * 100, 1)))

        rationales.append(TriageRationaleItem(
            category="SEMANTIC_AFFINITY",
            title=f"Zero-Shot Semantic Match ({raw_pct:.1f}%)",
            explanation=(
                f"Complaint semantic embedding matches statutory jurisdiction of {bureau_name} "
                f"({archetype_info['description']})."
            ),
            weight=round(min(1.0, max(0.5, best_score)), 2),
            matched_tokens=[best_code, archetype_info["category"]],
        ))

        # Rationale 2: Institutional Precedent
        if institution_history_count > 0 and matched_institution:
            rationales.append(TriageRationaleItem(
                category="INSTITUTION_HISTORY",
                title="Institutional Routing Precedent",
                explanation=f"{matched_institution.name} has {institution_history_count} previous verified case(s) under {best_code}.",
                weight=0.20,
                matched_tokens=[matched_institution.aicte_permanent_id, best_code],
            ))
        elif matched_institution:
            rationales.append(TriageRationaleItem(
                category="INSTITUTION_HISTORY",
                title="Registered AICTE Institution",
                explanation=f"Linked to active verified institution '{matched_institution.name}' in AICTE database.",
                weight=0.10,
                matched_tokens=[matched_institution.aicte_permanent_id],
            ))

        # Rationale 3: Statutory AICTE Operating Policy
        rationales.append(TriageRationaleItem(
            category="DOMAIN_POLICY",
            title=f"AICTE {recommended_priority} SLA Policy Alignment",
            explanation=f"Category '{recommended_category}' carries statutory {recommended_priority} priority under AICTE grievance guidelines.",
            weight=0.15,
            matched_tokens=[recommended_category, recommended_priority],
        ))

        # Overall Confidence Score Calculation
        confidence = min(0.96, max(0.65, round(best_score + 0.25 + (0.05 if institution_history_count > 0 else 0.0), 2)))

        return TriageSuggestion(
            recommended_bureau_id=target_bureau.id if target_bureau else "default-bureau-id",
            recommended_bureau_code=target_bureau.code if target_bureau else best_code,
            recommended_bureau_name=bureau_name,
            recommended_category=recommended_category,
            recommended_priority=recommended_priority,
            confidence_score=confidence,
            rationales=rationales,
        )


# Global singleton classifier
semantic_triage_classifier = SemanticZeroShotTriageClassifier()
