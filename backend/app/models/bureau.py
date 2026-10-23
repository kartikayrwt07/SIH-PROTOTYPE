import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Bureau(Base):
    __tablename__ = "bureaus"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="bureau")
    cases = relationship("ComplaintCase", back_populates="bureau")
    incoming_transfers = relationship(
        "CaseAssignmentHistory",
        foreign_keys="CaseAssignmentHistory.to_bureau_id",
        back_populates="to_bureau"
    )
    outgoing_transfers = relationship(
        "CaseAssignmentHistory",
        foreign_keys="CaseAssignmentHistory.from_bureau_id",
        back_populates="from_bureau"
    )
