from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.schemas.common import StandardResponse

router = APIRouter()


@router.api_route("/health", methods=["GET", "HEAD"], response_model=StandardResponse[dict])
def check_health(db: Session = Depends(get_db)):
    """Healthcheck endpoint verifying application runtime and database connectivity."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return StandardResponse(
        success=(db_status == "healthy"),
        data={
            "status": "operational" if db_status == "healthy" else "degraded",
            "service": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT,
            "database": db_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )

