from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.bureau import Bureau
from backend.app.schemas.bureau import BureauRead
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/bureaus")


@router.get("", response_model=StandardResponse[List[BureauRead]])
def list_bureaus(db: Session = Depends(get_db)):
    """Retrieve all active AICTE bureaus and cells for filtering and assignment."""
    bureaus = db.query(Bureau).filter(Bureau.is_active == True).order_by(Bureau.name).all()
    data = [BureauRead.model_validate(b) for b in bureaus]
    return StandardResponse(success=True, data=data)
