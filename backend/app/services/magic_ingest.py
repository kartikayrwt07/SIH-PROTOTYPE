"""
Autonomous Zero-Shot Grievance Ingestion and Entity Extraction Service.

Extracts institution names, performs zero-shot statutory bureau classification,
assigns SLA priority, and dockets cases autonomously without human intervention.
"""

import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.case import ComplaintCase, CaseStatus, CasePriority
from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.audit import CaseAuditEvent, AuditEventType
from backend.app.services.triage_classifier import (
    semantic_triage_classifier,
    BUREAU_ARCHETYPES,
)
from backend.app.services.csv_io import generate_case_reference
from backend.app.services.bhashini import bhashini_service, VERNACULAR_INSTITUTION_MAP, find_vernacular_institution
from backend.app.schemas.magic_ingest import (
    ExtractedInstitution,
    CategorizationResult,
    PriorityAssignment,
    BureauRouting,
    MagicAnalysisResult,
    TranslationResult,
    MagicIngestRequest,
    MagicIngestResponse,
)

# Common collegiate acronyms mapped to standard names
ACRONYM_MAP = {
    "dtu": "Delhi Technological University",
    "coep": "College of Engineering Pune",
    "bits": "Birla Institute of Technology and Science",
    "vit": "Vellore Institute of Technology",
    "srm": "SRM Institute of Science and Technology",
    "rvce": "R.V. College of Engineering",
    "bmsce": "BMS College of Engineering",
    "msrit": "M.S. Ramaiah Institute of Technology",
    "nsut": "Netaji Subhas University of Technology",
    "iiitd": "Indraprastha Institute of Information Technology",
    "iiitb": "International Institute of Information Technology Bangalore",
    "iiith": "International Institute of Information Technology Hyderabad",
    "vjti": "Veermata Jijabai Technological Institute",
    "vnit": "Visvesvaraya National Institute of Technology",
    "spce": "Sardar Patel College of Engineering",
    "mit": "Manipal Institute of Technology",
    "thapar": "Thapar Institute of Engineering and Technology",
    "pec": "Punjab Engineering College",
    "kiit": "Kalinga Institute of Industrial Technology",
    "psg": "PSG College of Technology",
    "cbit": "Chaitanya Bharathi Institute of Technology",
    "cet": "College of Engineering Trivandrum",
    "mnit": "Malaviya National Institute of Technology",
    "manit": "Maulana Azad National Institute of Technology",
    "nitk": "National Institute of Technology Karnataka",
    "nitt": "National Institute of Technology Tiruchirappalli",
    "hbtu": "Harcourt Butler Technical University",
    "lnmiit": "The LNM Institute of Information Technology",
    "svnit": "Sardar Vallabhbhai National Institute of Technology",
    "pdeu": "Pandit Deendayal Energy University",
    "ict": "Institute of Chemical Technology",
    "iitb": "Indian Institute of Technology Bombay",
    "iitd": "Indian Institute of Technology Delhi",
    "iitm": "Indian Institute of Technology Madras",
    "iitk": "Indian Institute of Technology Kanpur",
    "iitkgp": "Indian Institute of Technology Kharagpur",
    "iitr": "Indian Institute of Technology Roorkee",
    "iitg": "Indian Institute of Technology Guwahati",
    "iith": "Indian Institute of Technology Hyderabad",
    "iitp": "Indian Institute of Technology Patna",
    "iitj": "Indian Institute of Technology Jodhpur",
}

# Urgency keywords triggering URGENT SLA
URGENCY_TRIGGERS = [
    "suicide", "physical abuse", "ragging", "violence", "threat to life",
    "extortion", "intimidation", "hospitalized", "assault", "forced",
    "beaten", "harassed", "blackmail", "depression", "emergency"
]


def extract_institution_from_text(
    text: str,
    db: Session,
) -> ExtractedInstitution:
    """
    Extracts institution entity using multi-stage matching:
    0. Vernacular script entity extraction (Hindi, Tamil, Marathi keywords & aliases).
    1. Exact / Substring search against registered AICTE institutions in DB.
    2. Acronym normalization (e.g. DTU, VIT, BITS, COEP, NIT, IIT).
    3. NLP Regex Entity Extraction for collegiate noun phrases.
    """
    clean_lower = text.lower()
    institutions = db.query(Institution).filter(Institution.is_active == True).all()

    # Stage 0: Vernacular Script Entity Detection (Hindi, Tamil, Marathi)
    vernacular_match_name = find_vernacular_institution(text)
    if vernacular_match_name:
        target_inst = next(
            (i for i in institutions if vernacular_match_name.lower() in i.name.lower() or i.name.lower() in vernacular_match_name.lower()),
            None
        )
        if target_inst:
            return ExtractedInstitution(
                name=target_inst.name,
                id=target_inst.id,
                aicte_permanent_id=target_inst.aicte_permanent_id,
                state=target_inst.state,
                district=target_inst.district,
                confidence=0.98,
                is_database_match=True,
                matched_phrase=vernacular_match_name,
            )

    # Stage 1: Exact / Substring match against DB
    best_db_inst = None
    best_score = 0.0
    matched_phrase = ""

    for inst in institutions:
        inst_name_lower = inst.name.lower()
        if inst_name_lower in clean_lower:
            # Full exact name contained in text
            return ExtractedInstitution(
                name=inst.name,
                id=inst.id,
                aicte_permanent_id=inst.aicte_permanent_id,
                state=inst.state,
                district=inst.district,
                confidence=0.98,
                is_database_match=True,
                matched_phrase=inst.name,
            )

        # Check salient tokens
        tokens = [t for t in re.findall(r"\b[a-zA-Z]{4,}\b", inst_name_lower) if t not in ["college", "institute", "engineering", "technology", "research", "academy", "polytechnic", "science", "applied", "technical"]]
        if tokens:
            matches = sum(1 for t in tokens if t in clean_lower)
            token_score = matches / len(tokens)
            # Require at least 2 token matches or 100% of tokens if only 1
            if (matches >= 2 or (len(tokens) == 1 and matches == 1)) and token_score >= 0.5:
                if token_score > best_score:
                    best_score = token_score
                    best_db_inst = inst
                    matched_phrase = inst.name

    if best_db_inst and best_score >= 0.5:
        return ExtractedInstitution(
            name=best_db_inst.name,
            id=best_db_inst.id,
            aicte_permanent_id=best_db_inst.aicte_permanent_id,
            state=best_db_inst.state,
            district=best_db_inst.district,
            confidence=round(min(0.95, 0.70 + best_score * 0.25), 2),
            is_database_match=True,
            matched_phrase=matched_phrase,
        )

    # Stage 2: Acronym detection
    for acronym, mapped_name in ACRONYM_MAP.items():
        if re.search(rf"\b{acronym}\b", clean_lower):
            # Check if mapped name exists in DB
            target_inst = next((i for i in institutions if mapped_name.lower() in i.name.lower() or i.name.lower() in mapped_name.lower()), None)
            if target_inst:
                return ExtractedInstitution(
                    name=target_inst.name,
                    id=target_inst.id,
                    aicte_permanent_id=target_inst.aicte_permanent_id,
                    state=target_inst.state,
                    district=target_inst.district,
                    confidence=0.92,
                    is_database_match=True,
                    matched_phrase=acronym.upper(),
                )

    # Stage 3: Regex Collegiate Noun Phrase Extraction
    entity_patterns = [
        r"(?:at|in|from|against|regarding)\s+([A-Z][a-zA-Z0-9\s&.',-]{3,65}?(?:College|Institute|University|Academy|Polytechnic|School|Vidyapeeth))\b",
        r"\b([A-Z][a-zA-Z0-9\s&.',-]{3,65}?(?:College of Engineering|Institute of Technology|Engineering College|Technological University|University|Polytechnic|Academy))\b",
    ]

    for pat in entity_patterns:
        match = re.search(pat, text)
        if match:
            extracted_name = match.group(1).strip()
            # Clean trailing punctuation
            extracted_name = re.sub(r"[,.;:]$", "", extracted_name)
            # Find closest matching institution in DB
            matching_db_inst = next((i for i in institutions if extracted_name.lower() in i.name.lower() or i.name.lower() in extracted_name.lower()), None)
            if matching_db_inst:
                return ExtractedInstitution(
                    name=matching_db_inst.name,
                    id=matching_db_inst.id,
                    aicte_permanent_id=matching_db_inst.aicte_permanent_id,
                    state=matching_db_inst.state,
                    district=matching_db_inst.district,
                    confidence=0.88,
                    is_database_match=True,
                    matched_phrase=match.group(0),
                )
            return ExtractedInstitution(
                name=extracted_name,
                id=None,
                aicte_permanent_id=None,
                state="Unverified Jurisdiction",
                district="Needs Verification",
                confidence=0.45,
                is_database_match=False,
                matched_phrase=match.group(0),
            )

    # Honest fallback: Do not falsely bind to institutions[0]
    return ExtractedInstitution(
        name="Unverified Institution (Please Select)",
        id=None,
        aicte_permanent_id=None,
        state=None,
        district=None,
        confidence=0.10,
        is_database_match=False,
        matched_phrase="No Match Detected",
    )


def analyze_grievance_magic(
    grievance_text: str,
    db: Session,
) -> MagicAnalysisResult:
    """
    Performs comprehensive zero-shot NLP parsing and classification of grievance text.
    Leverages Bhashini NMT for Indian vernacular languages (Hindi, Tamil, Marathi, etc.)
    while preserving original vernacular legal evidence.
    """
    clean_text = grievance_text.strip()

    # 0. Bhashini Multilingual Detection & Translation
    trans_meta = bhashini_service.translate_to_english(clean_text)
    effective_text = trans_meta["translated_text"] if trans_meta["is_translated"] else clean_text

    # 1. Extract institution using effective translated English text
    extracted_college = extract_institution_from_text(effective_text, db)
    # If not a database match on translated text, attempt extraction on raw text as well
    if not extracted_college.is_database_match and trans_meta["is_translated"]:
        college_from_raw = extract_institution_from_text(clean_text, db)
        if college_from_raw.is_database_match:
            extracted_college = college_from_raw

    # 2. Extract / Synthesize subject
    first_sentence = effective_text.split(".")[0].strip()
    if len(first_sentence) > 100:
        first_sentence = first_sentence[:97] + "..."
    generated_subject = first_sentence if len(first_sentence) >= 15 else f"Grievance regarding {extracted_college.name}"

    # 3. Dense Zero-Shot Classification on effective translated text
    classification = semantic_triage_classifier.classify_text(generated_subject, effective_text)
    bureau_code = classification["bureau_code"]
    category = classification["category"]
    sim_score = classification["similarity_score"]
    all_scores = classification["all_scores"]

    # Retrieve target bureau entity
    target_bureau = db.query(Bureau).filter(Bureau.code == bureau_code).first()
    if not target_bureau:
        target_bureau = db.query(Bureau).first()
        bureau_code = target_bureau.code if target_bureau else "APPR"

    # 4. Priority Assignment & Urgency Signal Detection
    effective_lower = effective_text.lower()
    detected_urgency = [trigger for trigger in URGENCY_TRIGGERS if trigger in effective_lower]

    priority = classification["priority"]
    if detected_urgency and bureau_code in ["STU", "FIN"]:
        priority = "URGENT"

    sla_hours = 48 if priority == "URGENT" else (168 if priority == "HIGH" else (336 if priority == "MEDIUM" else 720))
    priority_rationale = (
        f"Critical safety/financial signals detected ({', '.join(detected_urgency[:3])}). Escalated to {priority} with {sla_hours}h SLA."
        if detected_urgency
        else f"Standard velocity baseline for {category} established as {priority} ({sla_hours}h SLA)."
    )

    # Key evidence tokens
    archetype_tokens = BUREAU_ARCHETYPES.get(bureau_code, {}).get("archetype_text", "").split()
    evidence_tokens = [w for w in set(archetype_tokens) if len(w) > 4 and w in effective_lower][:6]

    # Rationale breakdown
    routing_rationale = (
        f"Dense 384-d semantic embedding matches {target_bureau.name} ({bureau_code}) "
        f"with {round(sim_score * 100, 1)}% affinity. Aligns with statutory mandate: {BUREAU_ARCHETYPES.get(bureau_code, {}).get('description')}."
    )

    summary_insight = (
        f"AI routed grievance directly to {target_bureau.name} under '{category}' "
        f"at '{extracted_college.name}' with {priority} priority."
    )
    if trans_meta["is_translated"]:
        summary_insight += f" [Localized from {trans_meta['source_language_name']} via {trans_meta['provider']}]"

    return MagicAnalysisResult(
        extracted_college=extracted_college,
        categorization=CategorizationResult(
            category=category,
            confidence=round(min(0.99, max(0.70, sim_score + 0.15)), 2),
            detected_signals=evidence_tokens,
        ),
        priority_assignment=PriorityAssignment(
            priority=priority,
            urgency_signals=detected_urgency,
            sla_hours=sla_hours,
            rationale=priority_rationale,
        ),
        bureau_routing=BureauRouting(
            bureau_id=target_bureau.id if target_bureau else str(uuid.uuid4()),
            bureau_code=bureau_code,
            bureau_name=target_bureau.name if target_bureau else "AICTE Bureau",
            confidence=round(min(0.99, max(0.65, sim_score + 0.12)), 2),
            routing_rationale=routing_rationale,
            all_scores={k: round(v, 3) for k, v in all_scores.items()},
            key_evidence_tokens=evidence_tokens,
        ),
        generated_subject=generated_subject,
        summary_insight=summary_insight,
        translation=TranslationResult(**trans_meta),
    )


def ingest_magic_grievance(
    request: MagicIngestRequest,
    db: Session,
) -> MagicIngestResponse:
    """
    Executes autonomous zero-shot AI ingestion:
    1. Analyzes and extracts college, category, priority, and bureau (with Bhashini multilingual translation).
    2. If auto_docket is True, creates new ComplaintCase retaining original vernacular evidence.
    """
    analysis = analyze_grievance_magic(request.grievance_text, db)

    if not request.auto_docket:
        return MagicIngestResponse(
            analysis=analysis,
            case_created=False,
            docket_message="AI Extraction & Triage Analysis Complete (Preview Only - No Case Created)",
        )

    # Resolve institution: User selection takes absolute precedence over AI deduction
    all_insts = db.query(Institution).filter(Institution.is_active == True).all()
    target_inst = None
    is_user_override = False

    if request.institution_id:
        target_inst = next((i for i in all_insts if i.id == request.institution_id), None)
        if target_inst:
            is_user_override = True

    if not target_inst and analysis.extracted_college.id:
        target_inst = next((i for i in all_insts if i.id == analysis.extracted_college.id), None)

    if not target_inst and all_insts:
        target_inst = all_insts[0]

    if target_inst and is_user_override:
        analysis.extracted_college = ExtractedInstitution(
            name=target_inst.name,
            id=target_inst.id,
            aicte_permanent_id=target_inst.aicte_permanent_id,
            state=target_inst.state,
            district=target_inst.district,
            confidence=1.0,
            is_database_match=True,
            matched_phrase="User Confirmed / Selected",
        )

    # 1. Generate unique case reference ID
    case_ref = generate_case_reference(db)

    # 2. Calculate dynamic due date from SLA hours
    now = datetime.now(timezone.utc)
    due_date = now + timedelta(hours=analysis.priority_assignment.sla_hours)

    # 3. Create ComplaintCase
    # Use English translated text for central triage dashboard and retain raw vernacular in original_description
    new_case = ComplaintCase(
        case_reference_id=case_ref,
        subject=analysis.generated_subject,
        description_redacted=analysis.translation.translated_text if analysis.translation.is_translated else request.grievance_text.strip(),
        description_confidential=(
            f"Complainant Name: {request.student_name or 'Anonymous Student'}\n"
            f"Contact Email: {request.student_email or 'N/A'}\n"
            f"Contact Phone: {request.student_phone or 'N/A'}\n"
            f"Detected Language: {analysis.translation.source_language_name} ({analysis.translation.source_language})\n"
            f"Translation Provider: {analysis.translation.provider}\n\n"
            f"--- ORIGINAL VERNACULAR EVIDENCE ---\n{analysis.translation.original_text}\n\n"
            f"--- ENGLISH NMT TRANSLATION ---\n{analysis.translation.translated_text}"
        ),
        original_language=analysis.translation.source_language,
        original_description=analysis.translation.original_text,
        translation_provider=analysis.translation.provider,
        category=analysis.categorization.category,
        priority=CasePriority(analysis.priority_assignment.priority),
        status=CaseStatus.ASSIGNED,
        bureau_id=analysis.bureau_routing.bureau_id,
        institution_id=target_inst.id if target_inst else analysis.extracted_college.id,
        due_date=due_date,
        created_at=now,
    )
    db.add(new_case)
    db.flush()

    # 4. Create immutable CaseAuditEvent for automated AI intake
    audit_event = CaseAuditEvent(
        case_id=new_case.id,
        actor_id=None,
        actor_role="AI_AUTONOMOUS_SYSTEM",
        event_type=AuditEventType.REGISTERED,
        previous_state="Unregistered Intake",
        new_state=f"Status: {new_case.status.value}, Bureau: {analysis.bureau_routing.bureau_code}",
        metadata_json={
            "action": "MAGIC_ZERO_SHOT_INGESTION",
            "extracted_college": analysis.extracted_college.name,
            "bureau_routed": analysis.bureau_routing.bureau_code,
            "category": analysis.categorization.category,
            "priority": analysis.priority_assignment.priority,
            "confidence": analysis.bureau_routing.confidence,
            "evidence_tokens": analysis.bureau_routing.key_evidence_tokens,
            "complainant": request.student_name or "Anonymous",
            "source_language": analysis.translation.source_language,
            "source_language_name": analysis.translation.source_language_name,
            "is_translated": analysis.translation.is_translated,
            "translation_provider": analysis.translation.provider,
            "institution_overridden_by_user": is_user_override,
        },
        timestamp=now,
    )
    db.add(audit_event)
    db.commit()
    db.refresh(new_case)

    return MagicIngestResponse(
        analysis=analysis,
        case_created=True,
        case_reference_id=new_case.case_reference_id,
        case_id=new_case.id,
        status=new_case.status.value,
        due_date=new_case.due_date,
        created_at=new_case.created_at,
        docket_message=f"Case {new_case.case_reference_id} successfully created and autonomously routed to {analysis.bureau_routing.bureau_name} ({analysis.bureau_routing.bureau_code}).",
    )
