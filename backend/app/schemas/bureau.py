from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BureauBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class BureauCreate(BureauBase):
    pass


class BureauRead(BureauBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
