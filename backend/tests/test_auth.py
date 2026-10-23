import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base, get_db
from backend.app.core.security import create_access_token
from backend.app.core.auth import get_current_user, require_roles, assert_bureau_access, sanitize_case_for_role
from backend.app.models import User, UserRole, Bureau
from backend.app.main import app

client = TestClient(app)


def test_auth_me_with_demo_header():
    """Verify X-Demo-Role header resolves active user role."""
    response = client.get("/api/v1/auth/me", headers={"X-Demo-Role": "OFFICER"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["role"] == "OFFICER"
    assert "cases:read:bureau" in payload["data"]["permissions"]


def test_auth_me_with_auditor_role():
    """Verify AUDITOR role permissions."""
    response = client.get("/api/v1/auth/me", headers={"X-Demo-Role": "AUDITOR"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["role"] == "AUDITOR"
    assert "cases:read:all:redacted" in payload["data"]["permissions"]


def test_auth_switch_demo_role():
    """Verify role switching endpoint generates valid tokens."""
    response = client.get("/api/v1/auth/switch-demo-role/ADMIN")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user"]["role"] == "ADMIN"
    assert "token" in data

    # Use the generated token to access /api/v1/auth/me
    token = data["token"]
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["data"]["role"] == "ADMIN"


def test_rbac_endpoint_guard():
    """Verify require_roles blocks unauthorized roles with 403."""
    test_app = FastAPI()

    @test_app.get("/admin-only")
    def admin_route(user: User = Depends(require_roles(UserRole.ADMIN))):
        return {"authorized": True}

    test_client = TestClient(test_app)

    # 1. Access as Officer must fail with 403
    fail_res = test_client.get("/admin-only", headers={"X-Demo-Role": "OFFICER"})
    assert fail_res.status_code == 403
    assert fail_res.json()["detail"]["code"] == "INSUFFICIENT_ROLE_PERMISSIONS"

    # 2. Access as Admin must succeed with 200
    pass_res = test_client.get("/admin-only", headers={"X-Demo-Role": "ADMIN"})
    assert pass_res.status_code == 200
    assert pass_res.json()["authorized"] is True


def test_bureau_jurisdiction_idor_protection():
    """Verify Bureau Case Officers are prevented from accessing other bureaus (IDOR protection)."""
    officer_appr = User(
        id="usr-1",
        email="officer1@aicte.gov.in",
        role=UserRole.OFFICER,
        bureau_id="bureau-appr-id"
    )

    # Accessing own bureau is permitted
    assert_bureau_access(officer_appr, "bureau-appr-id")

    # Accessing another bureau raises 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        assert_bureau_access(officer_appr, "bureau-stu-id")
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "INSUFFICIENT_BUREAU_PERMISSIONS"

    # Supervisor has cross-bureau access
    supervisor = User(id="usr-2", role=UserRole.SUPERVISOR, bureau_id=None)
    assert_bureau_access(supervisor, "bureau-stu-id")  # Does not raise


def test_auditor_confidential_description_sanitization():
    """Verify sanitize_case_for_role nullifies confidential fields for Auditor."""
    raw_case = {
        "case_reference_id": "AICTE-2026-0001",
        "subject": "Ragging Complaint",
        "description_redacted": "Complainant reported intimidation in hostel.",
        "description_confidential": "Direct testimony from witness Rahul Verma (Phone: 9876543210).",
    }

    # Auditor view must have description_confidential stripped
    auditor_view = sanitize_case_for_role(raw_case, UserRole.AUDITOR)
    assert auditor_view["description_confidential"] is None
    assert auditor_view["description_redacted"] is not None

    # Officer view keeps confidential details for permitted investigation
    officer_view = sanitize_case_for_role(raw_case, UserRole.OFFICER)
    assert officer_view["description_confidential"] is not None
