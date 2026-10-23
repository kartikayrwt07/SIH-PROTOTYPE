from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.bureau import Bureau
from backend.app.models.user import User
from backend.app.schemas.bureau import BureauRead
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/bureaus")


@router.get("", response_model=StandardResponse[List[BureauRead]])
def list_bureaus(db: Session = Depends(get_db)):
    """Retrieve all active AICTE bureaus and cells for filtering and assignment."""
    bureaus = db.query(Bureau).filter(Bureau.is_active == True).order_by(Bureau.name).all()
    data = [BureauRead.model_validate(b) for b in bureaus]
    return StandardResponse(success=True, data=data)


@router.get("/{bureau_id}/officers")
def list_bureau_officers(bureau_id: str, db: Session = Depends(get_db)):
    """Retrieve active officers and personnel assigned to a specific AICTE bureau."""
    officers = (
        db.query(User)
        .filter(User.bureau_id == bureau_id, User.is_active == True)
        .order_by(User.full_name)
        .all()
    )
    data = [
        {"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role.value}
        for u in officers
    ]
    return StandardResponse(success=True, data=data)

