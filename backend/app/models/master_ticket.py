"""
Master Ticket Model — Smart Duplicate Grouping.

When the AI detects multiple students from the same college complaining about the
same issue (e.g., unapproved fees), the system groups them into a single "Master Ticket."
Resolving the master ticket cascades the resolution to all linked child complaints,
saving massive administrative processing time.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class MasterTicketStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class MasterTicket(Base):
    __tablename__ = "master_tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_reference_id = Column(String(50), unique=True, nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False, index=True)
    bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Consolidated subject and description representing the common grievance theme
    consolidated_subject = Column(String(500), nullable=False)
    consolidated_description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    common_grievance_theme = Column(String(255), nullable=True)

    # Grouping metadata
    child_count = Column(Integer, default=0, nullable=False)
    similarity_threshold = Column(Float, default=0.78, nullable=False)
    avg_similarity_score = Column(Float, default=0.0, nullable=False)

    status = Column(Enum(MasterTicketStatus), nullable=False, default=MasterTicketStatus.OPEN, index=True)
    resolution_remarks = Column(Text, nullable=True)
    time_saved_hours = Column(Float, default=0.0, nullable=False)  # Estimated admin hours saved

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    institution = relationship("Institution")
    bureau = relationship("Bureau")
    assigned_officer = relationship("User")
    child_cases = relationship("MasterTicketChild", back_populates="master_ticket", cascade="all, delete-orphan")

    @property
    def children(self):
        return self.child_cases

    __table_args__ = (
        Index("idx_master_institution_category", "institution_id", "category"),
        Index("idx_master_bureau_status", "bureau_id", "status"),
    )


class MasterTicketChild(Base):
    __tablename__ = "master_ticket_children"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    master_ticket_id = Column(String(36), ForeignKey("master_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("complaint_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False, default=0.0)
    linked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_anchor = Column(Boolean, default=False, nullable=False)  # The first/representative case

    # Relationships
    master_ticket = relationship("MasterTicket", back_populates="child_cases")
    case = relationship("ComplaintCase")

    __table_args__ = (
        Index("idx_child_master_case", "master_ticket_id", "case_id", unique=True),
    )
