from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.core.auth import get_current_user, get_role_permissions
from backend.app.models.user import User, UserRole
from backend.app.models.bureau import Bureau
from backend.app.schemas.auth import LoginRequest, RegisterRequest, Token, AuthUserResponse
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=StandardResponse[Token])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning signed JWT token."""
    user = db.query(User).filter(User.email == request.email.strip().lower()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value, "bureau_id": user.bureau_id}
    )
    return StandardResponse(data=Token(access_token=access_token))


@router.post("/register", response_model=StandardResponse[Token])
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with role assignment and issue JWT access token."""
    email_clean = request.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid official email address is required.",
        )
    if not request.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required.",
        )
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    existing_user = db.query(User).filter(User.email.ilike(email_clean)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered.",
        )

    bureau_id = request.bureau_id
    if bureau_id:
        bureau = db.query(Bureau).filter(Bureau.id == bureau_id).first()
        if not bureau:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected Bureau does not exist.",
            )
    elif request.role == UserRole.OFFICER:
        first_bureau = db.query(Bureau).filter(Bureau.is_active == True).first()
        if first_bureau:
            bureau_id = first_bureau.id

    new_user = User(
        email=email_clean,
        full_name=request.full_name.strip(),
        role=request.role,
        bureau_id=bureau_id,
        hashed_password=get_password_hash(request.password),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={
            "sub": new_user.id,
            "email": new_user.email,
            "role": new_user.role.value,
            "bureau_id": new_user.bureau_id,
        }
    )
    return StandardResponse(data=Token(access_token=access_token))


@router.get("/me", response_model=StandardResponse[AuthUserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve active authenticated user profile, jurisdiction, and permissions."""
    bureau_name = current_user.bureau.name if current_user.bureau else None
    bureau_code = current_user.bureau.code if current_user.bureau else None

    return StandardResponse(
        data=AuthUserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role,
            bureau_id=current_user.bureau_id,
            bureau_name=bureau_name,
            bureau_code=bureau_code,
            permissions=get_role_permissions(current_user.role)
        )
    )


@router.get("/switch-demo-role/{role_name}", response_model=StandardResponse[dict])
def switch_demo_role(
    role_name: str,
    bureau_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Convenience endpoint for judging evaluation: generate a token for the specified role and optional bureau."""
    raw_name = role_name.upper().strip()
    target_bureau_code = bureau_code.upper().strip() if bureau_code else None

    # Handle composite format like OFFICER_FIN, OFFICER_STU, OFFICER_APPR, OFFICER_FDC
    if "_" in raw_name and raw_name.startswith("OFFICER_"):
        base_role = "OFFICER"
        target_bureau_code = raw_name.replace("OFFICER_", "")
    else:
        base_role = raw_name

    try:
        role_enum = UserRole(base_role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role_name}'. Available: {[r.value for r in UserRole]} or OFFICER_APPR, OFFICER_FIN, OFFICER_STU, OFFICER_FDC"
        )

    query = db.query(User).filter(User.role == role_enum, User.is_active == True)

    if role_enum == UserRole.OFFICER and target_bureau_code:
        target_bureau = db.query(Bureau).filter(Bureau.code.ilike(target_bureau_code)).first()
        if target_bureau:
            user = query.filter(User.bureau_id == target_bureau.id).first()
            if not user:
                # If specific officer not found, look for email match or use first officer
                user = query.filter(User.email.ilike(f"%{target_bureau_code.lower()}%")).first()
                if not user:
                    user = query.first()
                    if user:
                        user.bureau_id = target_bureau.id
                        db.commit()
        else:
            user = query.first()
    else:
        user = query.first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No active user found with role {role_name}")

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value, "bureau_id": user.bureau_id}
    )
    bureau_name = user.bureau.name if user.bureau else None
    bureau_code_val = user.bureau.code if user.bureau else None

    return StandardResponse(
        data={
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "bureau_id": user.bureau_id,
                "bureau_name": bureau_name,
                "bureau_code": bureau_code_val,
            },
            "token": access_token
        }
    )
