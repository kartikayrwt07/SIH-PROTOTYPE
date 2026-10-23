import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    OFFICER = "OFFICER"
    AUDITOR = "AUDITOR"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(150), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.OFFICER)
    bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="SET NULL"), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    bureau = relationship("Bureau", back_populates="users")
    assigned_cases = relationship("ComplaintCase", back_populates="assigned_officer")
    audit_events = relationship("CaseAuditEvent", back_populates="actor")
    notes = relationship("CaseNote", back_populates="author")
