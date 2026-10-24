import os
import sys

# Critical: Enforce single-thread and memory arena limits before C extensions import
os.environ.setdefault("MALLOC_ARENA_MAX", "2")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")
os.environ.setdefault("ONNXRUNTIME_ENABLE_MEM_ARENA", "0")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

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
from backend.app.db.migrate_multilingual import migrate_multilingual_columns
from backend.app.db.migrate_master_tickets import migrate_master_ticket_tables
from backend.app.db.migrate_pgvector import migrate_pgvector
from backend.app.db.migrate_storage_url import migrate_storage_url

@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    import threading

    # Run DDL migrations only if explicitly enabled (tables already provisioned)
    if os.getenv("RUN_STARTUP_MIGRATIONS", "false").lower() in ("true", "1"):
        try:
            migrate_pgvector()
            migrate_storage_url()
            migrate_multilingual_columns()
            migrate_master_ticket_tables()
        except Exception as e:
            print(f"[Migration] check deferred: {e}")

    # Warm up in-memory vector similarity index only if explicitly enabled (saves ~250MB RAM on free tier)
    if os.getenv("ENABLE_EMBEDDING_WARMUP", "false").lower() in ("true", "1"):
        def _warmup():
            db = SessionLocal()
            try:
                vector_index.initialize_index(db)
            except Exception as e:
                print(f"[VectorIndexCache] Warmup deferred: {e}")
            finally:
                db.close()

        threading.Thread(target=_warmup, daemon=True, name="VectorIndexWarmup").start()

    # Free build/startup garbage to minimize RAM footprint
    import gc
    gc.collect()

    # Launch background Telegram Bot poller daemon if configured and enabled
    telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", settings.TELEGRAM_BOT_TOKEN)
    enable_poller = os.getenv("ENABLE_TELEGRAM_POLLER", "true").lower() in ("true", "1")
    if enable_poller and telegram_token and telegram_token != "DEMO_TELEGRAM_BOT_TOKEN":
        def _poller_worker():
            try:
                from backend.app.services.telegram_poller import run_poller
                print("[TelegramPoller] Starting background poller thread in FastAPI lifespan...")
                run_poller(bot_token=telegram_token)
            except Exception as e:
                print(f"[TelegramPoller] Poller thread error: {e}")

        threading.Thread(target=_poller_worker, daemon=True, name="TelegramPollerLifespan").start()

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

# CORS Configuration - permits local dev, Vercel deployments, Render, and Railway
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^https://.*\.railway\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


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
