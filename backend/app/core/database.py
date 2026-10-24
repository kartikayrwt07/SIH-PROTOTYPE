import re
import urllib.parse
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings


def sanitize_db_url(url: str) -> str:
    """
    Safely sanitizes cloud PostgreSQL connection strings (Render / Heroku / Supabase).
    Handles raw special characters in passwords (slashes, percent signs) and driver aliases.
    """
    if not url:
        return url

    # Normalize standard Postgres URL schemes to psycopg2
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Match: driver://username:password@host:port/dbname...
    pattern = r"^(?P<prefix>[a-zA-Z0-9+_-]+://)(?P<user>[^:]+):(?P<password>.+)@(?P<rest>[^@]+)$"
    m = re.match(pattern, url)
    if m:
        prefix = m.group("prefix")
        user = m.group("user")
        raw_pwd = m.group("password")
        rest = m.group("rest")
        # Unquote first to prevent double-encoding, then properly quote for URI standard
        unquoted = urllib.parse.unquote(raw_pwd)
        encoded_pwd = urllib.parse.quote_plus(unquoted)
        return f"{prefix}{user}:{encoded_pwd}@{rest}"

    return url


connect_args = {}
engine_kwargs = {"echo": False, "future": True}

effective_db_url = sanitize_db_url(settings.DATABASE_URL)

if effective_db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })

engine = create_engine(
    effective_db_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    future=True
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields database session and ensures closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
