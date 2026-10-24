"""
Automated lightweight SQLite/PostgreSQL migration for Multilingual Bhashini fields.
Ensures complaint_cases table has original_language, original_description, and translation_provider.
"""

from sqlalchemy import text
from backend.app.core.database import engine


def migrate_multilingual_columns():
    """Adds multilingual original evidence columns if they do not exist."""
    with engine.connect() as conn:
        # Check SQLite or PostgreSQL columns
        if engine.url.drivername.startswith("sqlite"):
            result = conn.execute(text("PRAGMA table_info(complaint_cases)"))
            columns = [row[1] for row in result.fetchall()]
            
            if "original_language" not in columns:
                conn.execute(text("ALTER TABLE complaint_cases ADD COLUMN original_language VARCHAR(20) DEFAULT 'en'"))
            if "original_description" not in columns:
                conn.execute(text("ALTER TABLE complaint_cases ADD COLUMN original_description TEXT"))
            if "translation_provider" not in columns:
                conn.execute(text("ALTER TABLE complaint_cases ADD COLUMN translation_provider VARCHAR(50) DEFAULT 'BHASHINI_NMT_ULCA'"))
            conn.commit()
        else:
            # PostgreSQL column addition with IF NOT EXISTS
            conn.execute(text("ALTER TABLE complaint_cases ADD COLUMN IF NOT EXISTS original_language VARCHAR(20) DEFAULT 'en'"))
            conn.execute(text("ALTER TABLE complaint_cases ADD COLUMN IF NOT EXISTS original_description TEXT"))
            conn.execute(text("ALTER TABLE complaint_cases ADD COLUMN IF NOT EXISTS translation_provider VARCHAR(50) DEFAULT 'BHASHINI_NMT_ULCA'"))
            conn.commit()


if __name__ == "__main__":
    migrate_multilingual_columns()
    print("Multilingual column migration completed successfully.")
