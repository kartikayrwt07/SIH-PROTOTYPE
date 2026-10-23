import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.audit import CaseAuditEvent, AuditEventType


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_csv_preview_validation(client: TestClient, db):
    # Retrieve existing bureau and institution
    bureau = db.query(Bureau).first()
    assert bureau is not None
    inst = db.query(Institution).first()
    assert inst is not None

    csv_data = f"""subject,description,bureau_code,institution_aicte_id,category,priority,is_confidential
"Valid Fee Exploitation Dispute","College charged additional capitation fee without valid receipt.","{bureau.code}","{inst.aicte_permanent_id}","Fee & Financial Irregularities","HIGH","false"
"Invalid Bureau Case","Laboratory equipment missing from physics lab.","BUR-NONEXISTENT","{inst.aicte_permanent_id}","Infrastructure Deficit","MEDIUM","false"
"Invalid Inst Case","Faculty members not paid salaries for six consecutive months.","{bureau.code}","NON-EXISTENT-INST","Faculty Shortage & Qualification","URGENT","true"
"""

    response = client.post(
        "/api/v1/cases/import/preview",
        json={"csv_content": csv_data},
        headers={"X-Demo-Role": "ADMIN"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    preview = data["data"]

    assert preview["total_rows"] == 3
    assert preview["valid_rows"] == 1
    assert preview["invalid_rows"] == 2
    assert preview["can_commit"] is True

    # Row 1 is valid
    assert preview["rows"][0]["is_valid"] is True
    assert preview["rows"][0]["bureau_name"] == bureau.name
    assert preview["rows"][0]["institution_name"] == inst.name

    # Row 2 has unknown bureau
    assert preview["rows"][1]["is_valid"] is False
    assert any(e["field"] == "bureau_code" for e in preview["rows"][1]["errors"])

    # Row 3 has unknown institution
    assert preview["rows"][2]["is_valid"] is False
    assert any(e["field"] == "institution_aicte_id" for e in preview["rows"][2]["errors"])


def test_csv_duplicate_warning(client: TestClient, db):
    existing_case = db.query(ComplaintCase).first()
    assert existing_case is not None

    bureau = db.query(Bureau).filter_by(id=existing_case.bureau_id).first()
    inst = db.query(Institution).filter_by(id=existing_case.institution_id).first()

    csv_data = f"""subject,description,bureau_code,institution_aicte_id,category,priority,is_confidential
"{existing_case.subject}","Duplicate grievance narrative regarding same matter.","{bureau.code}","{inst.aicte_permanent_id}","{existing_case.category}","MEDIUM","false"
"""

    response = client.post(
        "/api/v1/cases/import/preview",
        json={"csv_content": csv_data},
        headers={"X-Demo-Role": "ADMIN"},
    )

    assert response.status_code == 200
    preview = response.json()["data"]
    assert preview["rows"][0]["is_valid"] is True
    assert preview["rows"][0]["duplicate_case_ref"] is not None
    assert len(preview["rows"][0]["warnings"]) > 0
    assert "Potential duplicate" in preview["rows"][0]["warnings"][0]


def test_csv_batch_commit_atomic(client: TestClient, db):
    bureau = db.query(Bureau).first()
    inst = db.query(Institution).first()

    commit_payload = {
        "rows": [
            {
                "row_number": 1,
                "subject": "Automated Batch Import Case Alpha",
                "description": "Batch imported grievance regarding examination schedule irregularity.",
                "bureau_code": bureau.code,
                "institution_aicte_id": inst.aicte_permanent_id,
                "category": "Curriculum & Exam Irregularities",
                "priority": "HIGH",
                "is_confidential": False,
            },
            {
                "row_number": 2,
                "subject": "Automated Batch Import Case Beta (Confidential)",
                "description": "Sensitive whistleblower narrative regarding unlawful faculty appointment.",
                "bureau_code": bureau.code,
                "institution_aicte_id": inst.aicte_permanent_id,
                "category": "Faculty Shortage & Qualification",
                "priority": "URGENT",
                "is_confidential": True,
            },
        ],
        "skip_invalid": True,
    }

    response = client.post(
        "/api/v1/cases/import/commit",
        json=commit_payload,
        headers={"X-Demo-Role": "ADMIN"},
    )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    commit_res = res_data["data"]

    assert commit_res["imported_count"] == 2
    assert commit_res["skipped_count"] == 0
    created_refs = commit_res["created_case_references"]
    assert len(created_refs) == 2

    # Verify cases in database
    case_alpha = db.query(ComplaintCase).filter_by(case_reference_id=created_refs[0]).first()
    assert case_alpha is not None
    assert case_alpha.subject == "Automated Batch Import Case Alpha"
    assert case_alpha.status == CaseStatus.REGISTERED
    assert case_alpha.due_date is not None
    assert case_alpha.description_confidential is None

    case_beta = db.query(ComplaintCase).filter_by(case_reference_id=created_refs[1]).first()
    assert case_beta is not None
    assert case_beta.description_confidential is not None
    assert "[REDACTED" in case_beta.description_redacted

    # Verify audit events logged
    audit_alpha = db.query(CaseAuditEvent).filter_by(case_id=case_alpha.id).first()
    assert audit_alpha is not None
    assert audit_alpha.event_type == AuditEventType.REGISTERED
    assert audit_alpha.metadata_json.get("source") == "CSV_BATCH_INGESTION"


def test_csv_export_role_redaction(client: TestClient, db):
    # Test export as ADMIN (unredacted)
    admin_res = client.get(
        "/api/v1/cases/export/csv",
        headers={"X-Demo-Role": "ADMIN"},
    )
    assert admin_res.status_code == 200
    assert "text/csv" in admin_res.headers["content-type"]
    admin_csv = admin_res.text
    assert "Case Reference ID" in admin_csv
    assert "Institution AICTE ID" in admin_csv
    assert "Grievance Description" in admin_csv

    # Test export as AUDITOR (confidential complaints must be redacted)
    auditor_res = client.get(
        "/api/v1/cases/export/csv",
        headers={"X-Demo-Role": "AUDITOR"},
    )
    assert auditor_res.status_code == 200
    auditor_csv = auditor_res.text
    assert "Case Reference ID" in auditor_csv
    # Confidential description text should not leak to auditor
    assert "Sensitive whistleblower narrative" not in auditor_csv


def test_csv_empty_file_rejected(client: TestClient):
    res = client.post(
        "/api/v1/cases/import/preview",
        json={"csv_content": ""},
        headers={"X-Demo-Role": "ADMIN"},
    )
    assert res.status_code == 400
