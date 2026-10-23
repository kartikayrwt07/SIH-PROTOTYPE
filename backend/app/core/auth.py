from typing import List, Optional, Callable, Dict, Any
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User, UserRole
from backend.app.models.bureau import Bureau

security_scheme = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS: Dict[UserRole, List[str]] = {
    UserRole.ADMIN: [
        "cases:read:all",
        "cases:create",
        "cases:update:status",
        "cases:assign",
        "cases:notes:create",
        "cases:notes:read:confidential",
        "cases:export",
        "cases:import",
        "dashboard:read:all",
        "settings:manage",
        "audit:read:all",
    ],
    UserRole.SUPERVISOR: [
        "cases:read:all",
        "cases:assign",
        "cases:notes:create",
        "cases:notes:read:confidential",
        "cases:export",
        "dashboard:read:all",
        "audit:read:all",
    ],
    UserRole.OFFICER: [
        "cases:read:bureau",
        "cases:update:status",
        "cases:notes:create",
        "cases:notes:read:confidential",
        "dashboard:read:bureau",
        "audit:read:bureau",
    ],
    UserRole.AUDITOR: [
        "cases:read:all:redacted",
        "cases:export:redacted",
        "dashboard:read:all",
        "audit:read:all",
    ],
}


def get_role_permissions(role: UserRole) -> List[str]:
    return ROLE_PERMISSIONS.get(role, [])


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    x_demo_email: Optional[str] = Header(None, alias="X-Demo-Email"),
    db: Session = Depends(get_db),
) -> User:
    """Authentication dependency resolving current active user.

    Supports:
    1. Standard JWT Bearer token in Authorization header.
    2. Interactive demo simulation headers (X-Demo-Role / X-Demo-Email) for hackathon judging.
    """
    # 1. Check JWT token
    if auth_header and auth_header.credentials:
        payload = decode_access_token(auth_header.credentials)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == payload["sub"]).first()
            if user and user.is_active:
                return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Check Demo Role Simulation header
    if x_demo_role:
        try:
            role_enum = UserRole(x_demo_role.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid demo role: {x_demo_role}. Valid roles: {[r.value for r in UserRole]}"
            )

        query = db.query(User).filter(User.role == role_enum, User.is_active == True)
        if x_demo_email:
            user = query.filter(User.email == x_demo_email).first()
        else:
            user = query.first()

        if user:
            return user

        # Fallback simulated user if db is unseeded
        simulated = User(
            id=f"demo-{role_enum.value.lower()}-id",
            email=x_demo_email or f"{role_enum.value.lower()}@aicte-demo.gov.in",
            full_name=f"Demo {role_enum.value.capitalize()} User",
            role=role_enum,
            is_active=True
        )
        return simulated

    # 3. Default fallback for local testing: Central Supervisor
    default_user = db.query(User).filter(User.role == UserRole.SUPERVISOR).first()
    if default_user:
        return default_user

    # In worst case return mock admin
    return User(
        id="demo-admin-id",
        email="admin@aicte-demo.gov.in",
        full_name="System Administrator (Default)",
        role=UserRole.ADMIN,
        is_active=True
    )


def require_roles(*allowed_roles: UserRole) -> Callable:
    """Dependency factory enforcing server-side Role-Based Access Control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INSUFFICIENT_ROLE_PERMISSIONS",
                    "message": f"User role '{current_user.role.value}' is not permitted to perform this operation.",
                    "allowed_roles": [r.value for r in allowed_roles]
                }
            )
        return current_user
    return role_checker


def assert_bureau_access(user: User, case_bureau_id: str) -> None:
    """Assert that the user has jurisdiction to access or mutate cases in the target bureau.

    - ADMIN & SUPERVISOR: Universal cross-bureau jurisdiction.
    - OFFICER: Strictly confined to user.bureau_id. Accessing other bureaus raises 403 Forbidden.
    - AUDITOR: Read-only cross-bureau jurisdiction.
    """
    if user.role in [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AUDITOR]:
        return

    if user.role == UserRole.OFFICER:
        if not user.bureau_id or user.bureau_id != case_bureau_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INSUFFICIENT_BUREAU_PERMISSIONS",
                    "message": "Access denied: Case belongs to another bureau outside your jurisdiction.",
                    "user_bureau_id": user.bureau_id,
                    "target_bureau_id": case_bureau_id
                }
            )


def sanitize_case_for_role(case_dict: Dict[str, Any], user_role: UserRole) -> Dict[str, Any]:
    """Redact confidential fields when queried by Read-Only Auditor or unprivileged users."""
    sanitized = case_dict.copy()
    if user_role == UserRole.AUDITOR:
        sanitized["description_confidential"] = None
        # Mask sensitive subject names if necessary
        if "description_redacted" in sanitized and sanitized["description_redacted"]:
            pass  # description_redacted is already safe
    return sanitized
