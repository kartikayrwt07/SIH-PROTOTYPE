from typing import List
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AICTE Integrated Complaint Case Monitoring Dashboard"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./aicte_complaints.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "aicte-development-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    TELEGRAM_BOT_TOKEN: str = "DEMO_TELEGRAM_BOT_TOKEN"
    TELEGRAM_WEBHOOK_SECRET: str = ""

    # Cloud Storage & Bucket Configuration (Supabase Storage / AWS S3)
    STORAGE_PROVIDER: str = "supabase"  # "supabase" | "s3"
    SUPABASE_URL: str = "https://rocrtbthsbdkwikatjjf.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "aicte-case-evidence"
    AWS_S3_BUCKET: str = "aicte-case-evidence"
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
