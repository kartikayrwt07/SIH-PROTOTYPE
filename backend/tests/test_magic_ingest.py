import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_magic_analyze_ragging_grievance():
    """Verify zero-shot AI extraction of college, category, URGENT priority, and Student Welfare Cell routing."""
    text = (
        "I am a fresher at Bharati Institute of Technology & Science. In the hostel dorms, "
        "third-year seniors are forcing junior students to stay awake, subjecting us to physical abuse "
        "and violent intimidation. The warden refused to intervene."
    )
    response = client.post(
        "/api/v1/cases/magic-analyze",
        json={"grievance_text": text}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    # College extraction check
    assert "Bharati Institute" in data["extracted_college"]["name"]
    assert data["extracted_college"]["is_database_match"] is True

    # Routing check
    assert data["bureau_routing"]["bureau_code"] == "STU"
    assert "Student Welfare" in data["bureau_routing"]["bureau_name"]

    # Priority check
    assert data["priority_assignment"]["priority"] == "URGENT"
    assert "ragging" in data["priority_assignment"]["urgency_signals"] or "physical abuse" in data["priority_assignment"]["urgency_signals"]


def test_magic_analyze_financial_extortion_grievance():
    """Verify zero-shot AI extraction of fee irregularity and Finance Bureau routing."""
    text = (
        "Sahyadri Engineering College is refusing to refund my caution money deposit of Rs 50,000 "
        "and demanding capitation fee donation before releasing original certificates."
    )
    response = client.post(
        "/api/v1/cases/magic-analyze",
        json={"grievance_text": text}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    assert "Sahyadri" in data["extracted_college"]["name"]
    assert data["bureau_routing"]["bureau_code"] == "FIN"
    assert "Fee" in data["categorization"]["category"] or "Financial" in data["categorization"]["category"]


def test_magic_ingest_auto_docket():
    """Verify autonomous zero-shot docketing generates real case and persists to DB."""
    text = (
        "Avadh Institute of Engineering & Research has opened an unapproved artificial intelligence course "
        "with non-compliant laboratories and zero sanctioned equipment violating AICTE approval norms."
    )
    response = client.post(
        "/api/v1/cases/magic-ingest",
        json={
            "grievance_text": text,
            "student_name": "Aman Verma",
            "student_email": "aman.verma@example.edu",
            "auto_docket": True
        }
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    assert data["case_created"] is True
    assert data["case_reference_id"].startswith("AICTE-")
    assert data["status"] == "Assigned"
    assert data["analysis"]["bureau_routing"]["bureau_code"] == "APPR"


def test_magic_ingest_with_image_attachment_and_stream():
    import base64
    # 1x1 transparent PNG image base64
    sample_png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    text = (
        "National Institute of Technology has demanded illegal cash capitation fee. "
        "I am attaching the bank slip photograph as evidence of illicit transaction."
    )

    response = client.post(
        "/api/v1/cases/magic-ingest",
        json={
            "grievance_text": text,
            "student_name": "Rohan Gupta",
            "student_email": "rohan.gupta@example.edu",
            "auto_docket": True,
            "attachment_name": "capitation_fee_receipt.png",
            "attachment_base64": sample_png_b64,
            "attachment_mime": "image/png",
        }
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    data = payload["data"]
    assert data["case_created"] is True
    assert data["attachment_name"] == "capitation_fee_receipt.png"
    assert data["attachment_id"] is not None

    case_ref = data["case_reference_id"]
    att_id = data["attachment_id"]

    # Stream the file back
    stream_resp = client.get(f"/api/v1/cases/{case_ref}/attachments/{att_id}/file")
    assert stream_resp.status_code == 200
    assert "image/png" in stream_resp.headers.get("content-type", "")
    assert len(stream_resp.content) > 0
