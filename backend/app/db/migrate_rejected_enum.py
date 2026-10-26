"""
Migration script to add REJECTED value to PostgreSQL enums 'casestatus' and 'auditeventtype'.
"""
from sqlalchemy import text
from backend.app.core.database import engine

def migrate():
    print("Running migration for REJECTED enum values...")
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("ALTER TYPE casestatus ADD VALUE IF NOT EXISTS 'REJECTED'"))
        print("Added 'REJECTED' to casestatus enum.")
        conn.execute(text("ALTER TYPE auditeventtype ADD VALUE IF NOT EXISTS 'REJECTED'"))
        print("Added 'REJECTED' to auditeventtype enum.")

    with engine.connect() as conn:
        res1 = conn.execute(text("SELECT enum_range(NULL::casestatus)")).fetchall()
        print("Updated casestatus values:", res1)
        res2 = conn.execute(text("SELECT enum_range(NULL::auditeventtype)")).fetchall()
        print("Updated auditeventtype values:", res2)

if __name__ == "__main__":
    migrate()
