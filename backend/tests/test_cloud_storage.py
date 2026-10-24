"""
Automated unit & integration tests for Cloud Storage Buckets (Supabase Storage / S3).

Validates that:
1. Evidentiary attachments do NOT rely on ephemeral local disk paths.
2. Files uploaded via API generate valid secure cloud URLs (secure_url).
3. The storage_provider is tracked as 'supabase' or 's3'.
4. Existing and newly uploaded evidence documents can be directly opened via secure_url.
"""

import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.case import ComplaintCase
from backend.app.models.attachment import CaseAttachment, AttachmentCategory
from backend.app.services.cloud_storage import cloud_storage


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


def test_cloud_storage_service_upload():
    """Validates that cloud_storage service uploads and produces valid secure URLs."""
    file_bytes = b"%PDF-1.5 Verified AICTE Approval Certificate"
    storage_path, secure_url, bucket_name, provider = cloud_storage.upload_file(
        file_bytes=file_bytes,
        file_name="Approval_Order_2026.pdf",
        content_type="application/pdf",
        case_ref="AICTE-TEST-STORAGE",
    )
    assert storage_path.startswith("evidence/AICTE-TEST-STORAGE/")
    assert storage_path.endswith(".pdf")
    assert secure_url.startswith("https://")
    assert bucket_name in secure_url
    assert storage_path in secure_url
    assert provider in ["supabase", "s3"]


def test_attachment_upload_stores_secure_url(client: TestClient, db: Session):
    """Verifies that uploading via the API stores secure_url in the database."""
    case = db.query(ComplaintCase).first()
    assert case is not None

    pdf_bytes = b"%PDF-1.4 Lab Equipment Verification Report"
    files = {
        "file": ("lab_equipment_proof.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    data = {
        "category": "FACILITY_PHOTOGRAPH",
        "description": "High-voltage physics laboratory audit report",
        "is_confidential": "false"
    }

    res = client.post(
        f"/api/v1/cases/{case.case_reference_id}/attachments",
        files=files,
        data=data,
        headers={"X-Demo-Role": "SUPERVISOR"}
    )
    assert res.status_code == 200
    res_data = res.json()["data"]
    assert "secure_url" in res_data
    assert res_data["secure_url"].startswith("https://")
    assert "storage_provider" in res_data
    assert res_data["storage_provider"] in ["supabase", "s3"]

    # Verify directly from database
    db_attachment = db.query(CaseAttachment).filter(CaseAttachment.id == res_data["id"]).first()
    assert db_attachment is not None
    assert db_attachment.secure_url == res_data["secure_url"]
    assert db_attachment.storage_provider == res_data["storage_provider"]


def test_signed_url_generation():
    """Verifies presigned secure URL generation for privileged downloads."""
    sample_path = "evidence/AICTE-2026-APPR-001/audit_inspection_signed.pdf"
    signed_url = cloud_storage.generate_signed_url(sample_path, expires_in_seconds=1800)
    assert signed_url.startswith("https://")
    assert sample_path in signed_url
