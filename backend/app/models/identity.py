import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class VerificationMethod(str, enum.Enum):
    AADHAAR_OTP = "AADHAAR_OTP"
    DIGILOCKER_OAUTH = "DIGILOCKER_OAUTH"
    STUDENT_PORTAL_SSO = "STUDENT_PORTAL_SSO"
    MOBILE_EMAIL_2FA = "MOBILE_EMAIL_2FA"


class ComplainantType(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    PARENT = "PARENT"
    CITIZEN = "CITIZEN"


class ComplainantIdentity(Base):
    """
    Confidential Identity Vault storing verified complainant records.
    Decoupled from public complaint dossiers for whistleblower protection.
    """
    __tablename__ = "complainant_identities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=False, index=True)
    email = Column(String(150), nullable=False, index=True)
    complainant_type = Column(Enum(ComplainantType), nullable=False, default=ComplainantType.STUDENT)
    
    # Verification details
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_method = Column(Enum(VerificationMethod), nullable=False, default=VerificationMethod.MOBILE_EMAIL_2FA)
    masked_identifier = Column(String(50), nullable=False)  # e.g. "XXXX-XXXX-8921" or "REG-2023-****"
    verification_tx_ref = Column(String(100), unique=True, nullable=False, index=True)
    verification_metadata = Column(JSON, nullable=True)  # Provider metadata, timestamp, auth cert hash
    
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    cases = relationship("ComplaintCase", back_populates="complainant_identity")


class VerificationOTPChallenge(Base):
    """Temporary storage for active OTP challenges with strict expiry."""
    __tablename__ = "verification_otp_challenges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    target = Column(String(150), nullable=False, index=True)  # Phone number or email
    otp_code = Column(String(10), nullable=False)
    method = Column(Enum(VerificationMethod), nullable=False)
    complainant_type = Column(Enum(ComplainantType), nullable=False)
    full_name = Column(String(150), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    attempts = Column(String(5), default="0", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
