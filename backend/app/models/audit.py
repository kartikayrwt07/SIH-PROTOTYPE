import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AuditEventType(str, enum.Enum):
    REGISTERED = "REGISTERED"
    STATUS_CHANGE = "STATUS_CHANGE"
    REASSIGNED = "REASSIGNED"
    NOTE_ADDED = "NOTE_ADDED"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"
    REJECTED = "REJECTED"


class CaseAuditEvent(Base):
    __tablename__ = "case_audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("complaint_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role = Column(String(50), nullable=False)
    event_type = Column(Enum(AuditEventType), nullable=False, index=True)
    previous_state = Column(String(100), nullable=True)
    new_state = Column(String(100), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    case = relationship("ComplaintCase", back_populates="audit_events")
    actor = relationship("User", back_populates="audit_events")
