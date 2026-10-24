import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.sla import CasePriority


class CaseStatus(str, enum.Enum):
    RECEIVED = "Received"
    REGISTERED = "Registered"
    UNDER_TRIAGE = "Under Triage"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    AWAITING_INFORMATION = "Awaiting Information"
    UNDER_REVIEW = "Under Review"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class ComplaintCase(Base):
    __tablename__ = "complaint_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_reference_id = Column(String(50), unique=True, nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False, index=True)
    bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    complainant_identity_id = Column(String(36), ForeignKey("complainant_identities.id", ondelete="SET NULL"), nullable=True, index=True)

    subject = Column(String(255), nullable=False)
    description_redacted = Column(Text, nullable=False)
    description_confidential = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    priority = Column(Enum(CasePriority), nullable=False, default=CasePriority.MEDIUM, index=True)
    status = Column(Enum(CaseStatus), nullable=False, default=CaseStatus.RECEIVED, index=True)

    sla_policy_id = Column(String(36), ForeignKey("sla_policies.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(DateTime, nullable=True, index=True)
    escalation_level = Column(Integer, default=0, nullable=False, index=True)  # 0=Normal, 1=Approaching, 2=Overdue

    closure_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    institution = relationship("Institution", back_populates="cases")
    bureau = relationship("Bureau", back_populates="cases")
    assigned_officer = relationship("User", back_populates="assigned_cases")
    complainant_identity = relationship("ComplainantIdentity", back_populates="cases")
    sla_policy = relationship("SLAPolicy", back_populates="cases")
    assignment_history = relationship("CaseAssignmentHistory", back_populates="case", cascade="all, delete-orphan")
    audit_events = relationship("CaseAuditEvent", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")
    attachments = relationship("CaseAttachment", back_populates="case", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_cases_bureau_status", "bureau_id", "status"),
        Index("idx_cases_sla_due", "status", "due_date", "escalation_level"),
    )


class CaseAssignmentHistory(Base):
    __tablename__ = "case_assignment_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("complaint_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    from_bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="RESTRICT"), nullable=True)
    to_bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="RESTRICT"), nullable=False)
    assigned_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transfer_reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    case = relationship("ComplaintCase", back_populates="assignment_history")
    from_bureau = relationship("Bureau", foreign_keys=[from_bureau_id], back_populates="outgoing_transfers")
    to_bureau = relationship("Bureau", foreign_keys=[to_bureau_id], back_populates="incoming_transfers")
    assigned_by = relationship("User")


class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("complaint_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    is_confidential = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    case = relationship("ComplaintCase", back_populates="notes")
    author = relationship("User", back_populates="notes")
