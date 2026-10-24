from fastapi import APIRouter
from backend.app.api.v1 import health, auth, cases, bureaus, dashboard, ai, identity, master_tickets, telegram, institutions

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication & RBAC"])
api_router.include_router(identity.router, tags=["Complainant Identity Verification"])
api_router.include_router(cases.router, tags=["Cases & Lifecycle"])
api_router.include_router(bureaus.router, tags=["Bureaus"])
api_router.include_router(dashboard.router, tags=["Dashboard & Analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["Explainable AI Intelligence"])
api_router.include_router(master_tickets.router, prefix="/ai/master-tickets", tags=["Smart Duplicate Grouping"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["Telegram Bot Status Tracker"])
api_router.include_router(institutions.router, prefix="/institutions", tags=["Institution Trust Scores & Leaderboard"])

