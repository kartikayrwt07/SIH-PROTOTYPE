from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.app.core.config import settings
from contextlib import asynccontextmanager
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1.router import api_router
from backend.app.schemas.common import StandardResponse, ErrorInfo, ErrorDetail
from backend.app.services.vector_cache import vector_index

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up in-memory vector similarity index
    db = SessionLocal()
    try:
        vector_index.initialize_index(db)
    except Exception as e:
        print(f"[VectorIndexCache] Warmup deferred: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized, role-based complaint monitoring and lifecycle tracking platform for AICTE bureaus/cells.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for error in exc.errors():
        loc = " -> ".join(str(l) for l in error.get("loc", []))
        details.append(ErrorDetail(field=loc, message=error.get("msg", "Validation error")))

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=StandardResponse(
            success=False,
            error=ErrorInfo(
                code="VALIDATION_ERROR",
                message="Request payload failed validation schema.",
                details=details
            )
        ).model_dump(mode="json")
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=StandardResponse(
            success=False,
            error=ErrorInfo(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred. Please contact system administrator."
            )
        ).model_dump(mode="json")
    )


# Include v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "online"
    }
