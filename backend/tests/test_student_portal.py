"""
Tests for Student-Facing Web Dashboard & Complainant Document Upload.

Validates:
1. Complainant OTP challenge initiation and verification.
2. Confidential retrieval of complainant cases via /identity/my-cases.
3. Secure document upload for tickets in 'Awaiting Information' state.
4. Automatic lifecycle transition from 'Awaiting Information' to 'In Progress'.
5. IDOR prevention: unauthorized access to other complainants' cases rejected with 403.
"""

import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.identity import ComplainantIdentity, ComplainantType, VerificationMethod
from backend.app.models.case import ComplaintCase, CaseStatus

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_student_otp_login_and_my_cases_flow(db: Session):
    # 1. Initiate OTP for student
    send_resp = client.post(
        "/api/v1/identity/otp/send",
        json={
            "full_name": "Aarav Sharma",
            "target": "9876543210",
            "method": "MOBILE_EMAIL_2FA",
            "complainant_type": "STUDENT",
        },
    )
    assert send_resp.status_code == 200
    data = send_resp.json()["data"]
    tx_ref = data["tx_ref"]
    sandbox_otp = data.get("sandbox_otp")
    assert tx_ref is not None
    assert sandbox_otp is not None

    # 2. Verify OTP
    verify_resp = client.post(
        "/api/v1/identity/otp/verify",
        json={
            "tx_ref": tx_ref,
            "otp_code": sandbox_otp,
        },
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()["data"]
    token = verify_data["verification_token"]
    complainant_id = verify_data["complainant_id"]
    assert token is not None
    assert complainant_id is not None

    # 3. Retrieve Complainant Cases
    cases_resp = client.get(
        "/api/v1/identity/my-cases",
        headers={"X-Complainant-Token": token},
    )
    assert cases_resp.status_code == 200
    portal_data = cases_resp.json()["data"]
    assert "cases" in portal_data
    assert len(portal_data["cases"]) > 0
    assert portal_data["active_count"] >= 0

    # Find the case in 'Awaiting Information'
    awaiting_case = next(
        (c for c in portal_data["cases"] if c["status"] == "Awaiting Information"),
        None,
    )
    assert awaiting_case is not None, "A sample case in 'Awaiting Information' should be linked."
    assert awaiting_case["is_awaiting_information"] is True

    # 4. Upload requested document
    file_content = b"%PDF-1.4 Simulated Student Fee Receipt Evidence Document"
    file_upload = io.BytesIO(file_content)

    upload_resp = client.post(
        f"/api/v1/identity/cases/{awaiting_case['case_reference_id']}/upload",
        headers={"X-Complainant-Token": token},
        files={"file": ("fee_payment_receipt.pdf", file_upload, "application/pdf")},
        data={"description": "Official bank counterfoil payment receipt for 4th semester tuition fee."},
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()["data"]
    assert upload_data["new_status"] == "In Progress"
    assert upload_data["attachment"]["file_name"] == "fee_payment_receipt.pdf"

    # 5. Verify the case in DB is now 'In Progress'
    db_case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id == awaiting_case["case_reference_id"]).first()
    assert db_case.status.value == "In Progress"


def test_student_upload_idor_protection(db: Session):
    # Create two different complainant tokens
    # Student A
    resp_a = client.post("/api/v1/identity/otp/send", json={
        "full_name": "Student A", "target": "9111111111", "method": "MOBILE_EMAIL_2FA", "complainant_type": "STUDENT"
    })
    token_a = client.post("/api/v1/identity/otp/verify", json={
        "tx_ref": resp_a.json()["data"]["tx_ref"],
        "otp_code": resp_a.json()["data"]["sandbox_otp"]
    }).json()["data"]["verification_token"]

    # Student B
    resp_b = client.post("/api/v1/identity/otp/send", json={
        "full_name": "Student B", "target": "9222222222", "method": "MOBILE_EMAIL_2FA", "complainant_type": "STUDENT"
    })
    token_b = client.post("/api/v1/identity/otp/verify", json={
        "tx_ref": resp_b.json()["data"]["tx_ref"],
        "otp_code": resp_b.json()["data"]["sandbox_otp"]
    }).json()["data"]["verification_token"]

    # Fetch cases for Student A
    cases_a = client.get("/api/v1/identity/my-cases", headers={"X-Complainant-Token": token_a}).json()["data"]["cases"]
    case_ref_a = cases_a[0]["case_reference_id"]

    # Attempt to upload using Student B's token to Student A's case
    malicious_upload = client.post(
        f"/api/v1/identity/cases/{case_ref_a}/upload",
        headers={"X-Complainant-Token": token_b},
        files={"file": ("hack.pdf", io.BytesIO(b"malicious content"), "application/pdf")},
    )
    assert malicious_upload.status_code == 403
    assert "Access denied" in malicious_upload.json()["detail"]
