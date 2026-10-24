"""
Database migration: Create master_tickets and master_ticket_children tables.

Uses SQLAlchemy metadata to create tables idempotently across any database
engine (PostgreSQL, SQLite, etc.).
"""

from backend.app.core.database import Base, engine
from backend.app.models.master_ticket import MasterTicket, MasterTicketChild


def migrate_master_ticket_tables():
    """Creates master_tickets and master_ticket_children tables if they don't exist."""
    print("[Migration] Ensuring master_tickets and master_ticket_children tables exist...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                MasterTicket.__table__,
                MasterTicketChild.__table__,
            ],
            checkfirst=True,
        )
        print("[Migration] [OK] Master ticket tables checked/created successfully.")
    except Exception as e:
        print(f"[Migration] Warning: Could not create master ticket tables: {e}")
        raise


if __name__ == "__main__":
    migrate_master_ticket_tables()
