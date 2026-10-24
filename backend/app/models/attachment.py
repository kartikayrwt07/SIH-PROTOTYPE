import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AttachmentCategory(str, enum.Enum):
    FEE_RECEIPT = "FEE_RECEIPT"
    BANK_STATEMENT = "BANK_STATEMENT"
    AFFILIATION_DOCUMENT = "AFFILIATION_DOCUMENT"
    FACILITY_PHOTOGRAPH = "FACILITY_PHOTOGRAPH"
    SALARY_SLIP = "SALARY_SLIP"
    COMMUNICATION_RECORD = "COMMUNICATION_RECORD"
    OTHER = "OTHER"


class ScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    CLEAN = "CLEAN"
    INFECTED = "INFECTED"
    SKIPPED = "SKIPPED"


class CaseAttachment(Base):
    """
    Evidentiary document attachment linked to a specific ComplaintCase.
    Supports secure storage paths, MIME-type validation, and antivirus scanning audit.
    """
    __tablename__ = "case_attachments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("complaint_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    storage_path = Column(String(500), nullable=False)
    storage_bucket = Column(String(100), default="aicte-case-evidence", nullable=False)

    category = Column(Enum(AttachmentCategory), default=AttachmentCategory.OTHER, nullable=False)
    description = Column(String(255), nullable=True)
    is_confidential = Column(Boolean, default=False, nullable=False)

    # Security & Antivirus verification
    scan_status = Column(Enum(ScanStatus), default=ScanStatus.CLEAN, nullable=False)
    sha256_hash = Column(String(64), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    case = relationship("ComplaintCase", back_populates="attachments")
    uploader = relationship("User")
