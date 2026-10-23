from typing import Optional, List
from pydantic import BaseModel
from backend.app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    email: str
    role: UserRole
    bureau_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    bureau_id: Optional[str] = None
    bureau_name: Optional[str] = None
    bureau_code: Optional[str] = None
    permissions: List[str]
