import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class CasePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String(100), nullable=False, index=True)
    priority = Column(Enum(CasePriority), nullable=False, default=CasePriority.MEDIUM)
    resolution_hours = Column(Integer, nullable=False, default=168)  # default 7 days
    warning_threshold_hours = Column(Integer, nullable=False, default=48)  # alert at <48h
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    cases = relationship("ComplaintCase", back_populates="sla_policy")
