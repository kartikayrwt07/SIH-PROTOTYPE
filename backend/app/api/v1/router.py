from fastapi import APIRouter
from backend.app.api.v1 import health, auth, cases, bureaus, dashboard, ai, identity

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication & RBAC"])
api_router.include_router(identity.router, tags=["Complainant Identity Verification"])
api_router.include_router(cases.router, tags=["Cases & Lifecycle"])
api_router.include_router(bureaus.router, tags=["Bureaus"])
api_router.include_router(dashboard.router, tags=["Dashboard & Analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["Explainable AI Intelligence"])

