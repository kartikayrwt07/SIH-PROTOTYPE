"""
Automated tests for Case Attachments, MIME-type enforcement,
file size constraints, and antivirus scanning simulation.
"""

import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.case import ComplaintCase
from backend.app.models.attachment import AttachmentCategory, ScanStatus
from backend.app.services.attachment import create_case_attachment, simulate_antivirus_scan


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


def test_antivirus_detection():
    clean_bytes = b"%PDF-1.4 official document content for complaint"
    status_clean, hash_clean = simulate_antivirus_scan(clean_bytes, "valid.pdf")
    assert status_clean == ScanStatus.CLEAN
    assert len(hash_clean) == 64

    # EICAR signature detection
    eicar_bytes = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    status_infected, _ = simulate_antivirus_scan(eicar_bytes, "test.pdf")
    assert status_infected == ScanStatus.INFECTED


def test_case_attachment_upload_and_retrieval(client: TestClient, db: Session):
    case = db.query(ComplaintCase).first()
    assert case is not None

    # 1. Valid PDF Upload
    pdf_content = b"%PDF-1.4 Sample fee receipt evidence content"
    files = {
        "file": ("fee_receipt.pdf", io.BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "category": "FEE_RECEIPT",
        "description": "Original bank fee deposit slip",
        "is_confidential": "false"
    }

    res_upload = client.post(
        f"/api/v1/cases/{case.case_reference_id}/attachments",
        files=files,
        data=data,
        headers={"X-Demo-Role": "SUPERVISOR"}
    )
    assert res_upload.status_code == 200
    upload_json = res_upload.json()
    assert upload_json["success"] is True
    assert upload_json["data"]["file_name"] == "fee_receipt.pdf"
    assert upload_json["data"]["category"] == "FEE_RECEIPT"
    assert upload_json["data"]["scan_status"] == "CLEAN"

    # 2. List attachments for this case
    res_list = client.get(
        f"/api/v1/cases/{case.case_reference_id}/attachments",
        headers={"X-Demo-Role": "SUPERVISOR"}
    )
    assert res_list.status_code == 200
    list_json = res_list.json()
    assert list_json["success"] is True
    assert len(list_json["data"]) >= 1


def test_malicious_upload_rejected(client: TestClient, db: Session):
    case = db.query(ComplaintCase).first()
    assert case is not None

    eicar_bytes = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    files = {
        "file": ("malware_payload.pdf", io.BytesIO(eicar_bytes), "application/pdf")
    }

    res_malicious = client.post(
        f"/api/v1/cases/{case.case_reference_id}/attachments",
        files=files,
        headers={"X-Demo-Role": "ADMIN"}
    )
    assert res_malicious.status_code == 400
    assert "Antivirus scanner detected malicious signature" in res_malicious.json()["detail"]
