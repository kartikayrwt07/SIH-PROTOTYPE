from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.attachment import AttachmentCategory, ScanStatus


class CaseAttachmentRead(BaseModel):
    id: str
    case_id: str
    uploaded_by_id: Optional[str] = None
    file_name: str
    file_size_bytes: int
    mime_type: str
    storage_path: str
    storage_bucket: str
    category: AttachmentCategory
    description: Optional[str] = None
    is_confidential: bool
    scan_status: ScanStatus
    sha256_hash: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PresignedUploadRequest(BaseModel):
    file_name: str
    file_size_bytes: int
    mime_type: str
    category: AttachmentCategory = AttachmentCategory.OTHER
    description: Optional[str] = None
    is_confidential: bool = False


class PresignedUploadResponse(BaseModel):
    attachment_id: str
    upload_url: str
    storage_path: str
    storage_bucket: str
    expires_in_seconds: int
    headers: dict = {}
