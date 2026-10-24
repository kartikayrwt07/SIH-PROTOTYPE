"""
Database migration: Add secure_url and storage_provider to case_attachments.

Replaces local file path reliance with cloud bucket secure URLs (Supabase Storage / AWS S3).
Safe and idempotent across PostgreSQL/Supabase and SQLite.
"""

from sqlalchemy import text, inspect
from backend.app.core.database import engine
from backend.app.core.config import settings


def migrate_storage_url():
    """Adds secure_url and storage_provider to case_attachments if missing, and backfills URLs."""
    print("[Migration] Checking case_attachments table for secure_url and storage_provider...")
    inspector = inspect(engine)
    if "case_attachments" not in inspector.get_table_names():
        print("[Migration] Note: case_attachments table does not exist yet. Skipping.")
        return

    cols = [c["name"] for c in inspector.get_columns("case_attachments")]
    with engine.connect() as conn:
        # Add storage_provider if missing
        if "storage_provider" not in cols:
            print("[Migration] Adding storage_provider column to case_attachments...")
            if engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE case_attachments ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 'supabase';"))
            else:
                conn.execute(text("ALTER TABLE case_attachments ADD COLUMN storage_provider VARCHAR(50) DEFAULT 'supabase';"))
            conn.commit()
            print("[Migration] [OK] Added storage_provider column.")

        # Add secure_url if missing
        if "secure_url" not in cols:
            print("[Migration] Adding secure_url column to case_attachments...")
            if engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE case_attachments ADD COLUMN IF NOT EXISTS secure_url VARCHAR(1000);"))
            else:
                conn.execute(text("ALTER TABLE case_attachments ADD COLUMN secure_url VARCHAR(1000);"))
            conn.commit()
            print("[Migration] [OK] Added secure_url column.")

        # Backfill any existing attachments where secure_url is null
        base_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public"
        if engine.dialect.name == "postgresql":
            conn.execute(text(f"""
                UPDATE case_attachments
                SET secure_url = '{base_url}/' || storage_bucket || '/' || storage_path,
                    storage_provider = COALESCE(storage_provider, 'supabase')
                WHERE secure_url IS NULL OR secure_url = '';
            """))
            conn.commit()
        else:
            conn.execute(text(f"""
                UPDATE case_attachments
                SET secure_url = '{base_url}/' || storage_bucket || '/' || storage_path,
                    storage_provider = COALESCE(storage_provider, 'supabase')
                WHERE secure_url IS NULL OR secure_url = '';
            """))
            conn.commit()

        print("[Migration] [OK] case_attachments storage_url verified and backfilled successfully.")


if __name__ == "__main__":
    migrate_storage_url()
