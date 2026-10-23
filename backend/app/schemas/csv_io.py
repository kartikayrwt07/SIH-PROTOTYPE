from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CsvRowError(BaseModel):
    row_number: int
    field: str
    message: str


class CsvRowPreview(BaseModel):
    row_number: int
    is_valid: bool
    institution_aicte_id: str
    institution_name: Optional[str] = None
    bureau_code: str
    bureau_name: Optional[str] = None
    subject: str
    category: str
    priority: str = "MEDIUM"
    is_confidential: bool = False
    description: str
    errors: List[CsvRowError] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    duplicate_case_ref: Optional[str] = None


class CsvPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    can_commit: bool
    rows: List[CsvRowPreview]


class CsvCommitRequest(BaseModel):
    rows: List[Dict[str, Any]]
    skip_invalid: bool = True


class CsvCommitResponse(BaseModel):
    imported_count: int
    skipped_count: int
    failed_count: int
    created_case_references: List[str]
