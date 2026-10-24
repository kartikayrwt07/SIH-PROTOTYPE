"""
Unit and Integration Tests for Bhashini Multilingual Localization & Triage Ingestion.
Tests language detection, NMT translation preservation, and database evidence archival
for Hindi, Tamil, and Marathi student grievances.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.bhashini import bhashini_service

client = TestClient(app)


def test_bhashini_script_detection():
    """Verify accurate detection of Hindi, Tamil, Marathi, and English scripts."""
    # Hindi (Devanagari with Hindi markers)
    hindi_text = "मैं भारती इंस्टीट्यूट ऑफ टेक्नोलॉजी एंड साइंस का प्रथम वर्ष का छात्र हूँ। छात्रावास में रैगिंग हो रही है।"
    lang, name, conf = bhashini_service.detect_language(hindi_text)
    assert lang == "hi"
    assert "Hindi" in name
    assert conf >= 0.85

    # Tamil
    tamil_text = "நான் வேலூர் மெட்ரோபொலிட்டன் தொழில்நுட்பக் கல்லூரியின் முதலாமாண்டு மாணவன்."
    lang, name, conf = bhashini_service.detect_language(tamil_text)
    assert lang == "ta"
    assert "Tamil" in name
    assert conf >= 0.90

    # Marathi (Devanagari with Marathi markers)
    marathi_text = "सह्याद्री अभियांत्रिकी महाविद्यालयात मान्यता नसलेला अभ्यासक्रम चालवला जात आहे."
    lang, name, conf = bhashini_service.detect_language(marathi_text)
    assert lang == "mr"
    assert "Marathi" in name
    assert conf >= 0.85

    # English
    english_text = "I am a first-year student facing fee refund issues at Sahyadri Engineering College."
    lang, name, conf = bhashini_service.detect_language(english_text)
    assert lang == "en"
    assert name == "English"
    assert conf == 1.0


def test_bhashini_translation_service():
    """Verify translation metadata structure and domain translation."""
    hindi_text = "मैं भारती इंस्टीट्यूट ऑफ टेक्नोलॉजी एंड साइंस का प्रथम वर्ष का छात्र हूँ। छात्रावास में रैगिंग हो रही है।"
    res = bhashini_service.translate_to_english(hindi_text)

    assert res["is_translated"] is True
    assert res["source_language"] == "hi"
    assert "Hindi" in res["source_language_name"]
    assert res["original_text"] == hindi_text
    assert "Bharati Institute" in res["translated_text"]
    assert "ragging" in res["translated_text"].lower()

    # English text should bypass translation
    eng_res = bhashini_service.translate_to_english("Standard English grievance description.")
    assert eng_res["is_translated"] is False
    assert eng_res["source_language"] == "en"
    assert eng_res["provider"] == "DIRECT"


def test_magic_analyze_hindi_ragging():
    """Verify zero-shot AI analyzes Hindi grievance, routes to STU Bureau, and escalates to URGENT."""
    hindi_grievance = (
        "मैं भारती इंस्टीट्यूट ऑफ टेक्नोलॉजी एंड साइंस का प्रथम वर्ष का छात्र हूँ। "
        "छात्रावास में सीनियर छात्रों द्वारा हमारे साथ गंभीर मारपीट और रैगिंग की जा रही है। "
        "वार्डन को शिकायत करने पर हमें जान से मारने की धमकी दी गई है।"
    )
    response = client.post(
        "/api/v1/cases/magic-analyze",
        json={"grievance_text": hindi_grievance}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    # Check translation metadata
    assert data["translation"]["is_translated"] is True
    assert data["translation"]["source_language"] == "hi"
    assert "Hindi" in data["translation"]["source_language_name"]
    assert data["translation"]["original_text"] == hindi_grievance

    # College extraction on translated text
    assert "Bharati Institute" in data["extracted_college"]["name"]

    # Autonomous Bureau Routing
    assert data["bureau_routing"]["bureau_code"] == "STU"

    # Priority escalated to URGENT due to safety trigger
    assert data["priority_assignment"]["priority"] == "URGENT"
    assert data["priority_assignment"]["sla_hours"] == 48


def test_magic_ingest_tamil_fee_extortion_with_evidence():
    """Verify autonomous docketing of Tamil grievance archives original vernacular as legal evidence."""
    tamil_grievance = (
        "நான் வேலூர் மெட்ரோபொலிட்டன் தொழில்நுட்பக் கல்லூரியின் முதலாமாண்டு மாணவன். "
        "கல்லூரி நிர்வாகம் அனுமதிக்கப்படாத கூடுதல் கட்டணம் மற்றும் நன்கொடை வசூலிக்கிறது. "
        "மேலும் எங்களது அசல் 12-ஆம் வகுப்பு சான்றிதழ்களை திருப்பித் தர மறுக்கிறது."
    )
    response = client.post(
        "/api/v1/cases/magic-ingest",
        json={
            "grievance_text": tamil_grievance,
            "student_name": "Senthil Nathan",
            "student_email": "senthil.n@example.edu",
            "auto_docket": True
        }
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    assert data["case_created"] is True
    case_ref = data["case_reference_id"]
    assert case_ref.startswith("AICTE-")
    assert data["analysis"]["translation"]["source_language"] == "ta"

    # Fetch created case from public API to ensure evidence is stored in DB
    get_res = client.get(f"/api/v1/cases/{case_ref}")
    assert get_res.status_code == 200
    case_detail = get_res.json()["data"]

    # Verify original vernacular text is retained as legal evidence
    assert case_detail["original_language"] == "ta"
    assert case_detail["original_description"] == tamil_grievance
    assert "BHASHINI" in case_detail["translation_provider"]

    # Verify description_redacted contains English translation for central triage
    assert "Vellore" in case_detail["description_redacted"] or "fees" in case_detail["description_redacted"].lower()


def test_hindi_custom_college_extraction():
    """Verify that entering another college in Hindi does NOT default to Bharati Institute."""
    hindi_avadh = "मैं अवध इंस्टीट्यूट का छात्र हूँ। यहाँ छात्रावास में सीनियर्स द्वारा मारपीट और रैगिंग की जा रही है।"
    response = client.post(
        "/api/v1/cases/magic-analyze",
        json={"grievance_text": hindi_avadh}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "Avadh" in data["extracted_college"]["name"]
    assert "Bharati" not in data["extracted_college"]["name"]


def test_magic_ingest_user_institution_override():
    """Verify that a user-specified institution_id overrides any AI deduction."""
    inst_res = client.get("/api/v1/institutions/all")
    assert inst_res.status_code == 200
    institutions = inst_res.json()["data"]
    assert len(institutions) >= 2
    chosen_inst = institutions[1]  # Pick the second institution

    response = client.post(
        "/api/v1/cases/magic-ingest",
        json={
            "grievance_text": "Random grievance narrative with no college mention at all regarding laboratory fees.",
            "student_name": "Test Complainant",
            "institution_id": chosen_inst["id"],
            "auto_docket": True,
        }
    )
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["case_created"] is True
    assert res_data["analysis"]["extracted_college"]["id"] == chosen_inst["id"]
    assert res_data["analysis"]["extracted_college"]["name"] == chosen_inst["name"]


def test_iit_bombay_hindi_statutory_extraction():
    """
    CRITICAL: Verify that entering 'भारतीय प्रौद्योगिकी संस्थान मुंबई' correctly extracts
    Indian Institute of Technology Bombay (IIT Bombay) with permanent ID 1-3001011,
    and produces a clean certified English translation without substring false-matching 'भारती'.
    """
    hindi_iitb = "भारतीय प्रौद्योगिकी संस्थान मुंबई"
    response = client.post(
        "/api/v1/cases/magic-analyze",
        json={"grievance_text": hindi_iitb}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    college = data["extracted_college"]
    
    assert "Indian Institute of Technology Bombay" in college["name"]
    assert college["aicte_permanent_id"] == "1-3001011"
    assert "Bharati" not in college["name"]
    assert college["confidence"] >= 0.95
    
    # Verify translation
    trans = data["translation"]
    assert trans["source_language"] == "hi"
    assert "Indian Institute of Technology Bombay" in trans["translated_text"]
    assert "भारतीय" not in trans["translated_text"]

