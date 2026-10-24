"""
Unit and API integration tests for Complainant Identity Verification,
OTP challenges, Whistleblower Shielding, and Verification Badges.
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.identity import (
    ComplainantIdentity,
    VerificationOTPChallenge,
    VerificationMethod,
    ComplainantType,
)
from backend.app.models.case import ComplaintCase
from backend.app.schemas.identity import SendOtpRequest, VerifyOtpRequest
from backend.app.services.identity import (
    initiate_otp_challenge,
    verify_otp_challenge,
    resolve_verified_identity,
    mask_identifier,
)


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


def test_mask_identifier():
    assert mask_identifier("9876543210", VerificationMethod.MOBILE_EMAIL_2FA) == "XXXX-XX-3210"
    assert mask_identifier("student.rahul@institute.ac.in", VerificationMethod.STUDENT_PORTAL_SSO) == "s***@institute.ac.in"


def test_otp_dispatch_and_verification(db: Session):
    """Test full cycle: initiate OTP challenge -> verify OTP -> mint verification token."""
    req = SendOtpRequest(
        full_name="Aarav Sharma",
        target="9876543210",
        method=VerificationMethod.AADHAAR_OTP,
        complainant_type=ComplainantType.STUDENT,
    )

    otp_resp = initiate_otp_challenge(db, req)
    assert otp_resp.tx_ref.startswith("KYC-CHALLENGE-")
    assert otp_resp.target_masked == "XXXX-XX-3210"
    assert otp_resp.sandbox_otp is not None  # In test environment

    # Verify with incorrect OTP first
    with pytest.raises(ValueError, match="Incorrect verification code"):
        verify_otp_challenge(db, VerifyOtpRequest(tx_ref=otp_resp.tx_ref, otp_code="000000"))

    # Verify with correct OTP
    verified_token = verify_otp_challenge(
        db,
        VerifyOtpRequest(tx_ref=otp_resp.tx_ref, otp_code=otp_resp.sandbox_otp)
    )

    assert verified_token.full_name == "Aarav Sharma"
    assert verified_token.verification_token is not None
    assert verified_token.is_whistleblower_shielded is True

    # Check database identity record
    identity = resolve_verified_identity(db, verified_token.verification_token)
    assert identity is not None
    assert identity.is_verified is True
    assert identity.phone_number == "9876543210"
    assert identity.masked_identifier == "XXXX-XX-3210"


def test_identity_api_endpoints(client: TestClient):
    """Test HTTP endpoints for OTP dispatch and validation."""
    # 1. Send OTP
    send_payload = {
        "full_name": "Pooja Patel",
        "target": "pooja.patel@aicte.gov.in",
        "method": "MOBILE_EMAIL_2FA",
        "complainant_type": "FACULTY"
    }
    res_send = client.post("/api/v1/identity/otp/send", json=send_payload)
    assert res_send.status_code == 200
    send_data = res_send.json()
    assert send_data["success"] is True
    tx_ref = send_data["data"]["tx_ref"]
    sandbox_otp = send_data["data"]["sandbox_otp"]

    # 2. Verify OTP
    verify_payload = {
        "tx_ref": tx_ref,
        "otp_code": sandbox_otp
    }
    res_verify = client.post("/api/v1/identity/otp/verify", json=verify_payload)
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is True
    token = verify_data["data"]["verification_token"]

    # 3. Inspect token status
    res_check = client.get("/api/v1/identity/verify-token", headers={"X-Complainant-Token": token})
    assert res_check.status_code == 200
    check_data = res_check.json()
    assert check_data["data"]["is_verified"] is True
    assert check_data["data"]["complainant_type"] == "FACULTY"
