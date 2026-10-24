"""
FastAPI Endpoints for Telegram Bot Grievance Tracker Webhook & Simulator.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Request, Header, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.schemas.common import StandardResponse
from backend.app.services.telegram_bot import (
    process_telegram_update,
    extract_case_reference,
    format_welcome_message,
)

router = APIRouter()


class TelegramSimulateRequest(BaseModel):
    message: str = Field(..., description="Message text as sent by student (e.g. 'AIC-2026-0001' or '/start')")
    first_name: Optional[str] = Field("Student", description="First name of complainant")
    chat_id: Optional[int] = Field(99999999, description="Simulated Telegram chat ID")


class TelegramSimulateResponse(BaseModel):
    message_sent: str
    reply_html: str
    extracted_case_ref: Optional[str] = None
    chat_id: int
    parse_mode: str = "HTML"


class TelegramBotInfo(BaseModel):
    bot_name: str
    bot_username: str
    is_configured: bool
    webhook_url_example: str
    commands: list[dict]
    supported_formats: list[str]


@router.post("/webhook", summary="Telegram Bot Webhook Receiver")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_telegram_bot_api_secret_token: Optional[str] = Header(None),
):
    """
    Receives incoming webhook updates from Telegram Bot API.
    
    Extracts the Case Reference ID from incoming messages and returns
    a Telegram webhook response (`sendMessage`) providing real-time status.
    """
    # Optional secret validation if configured
    if settings.TELEGRAM_WEBHOOK_SECRET and x_telegram_bot_api_secret_token != settings.TELEGRAM_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Telegram webhook secret token"
        )

    try:
        update: Dict[str, Any] = await request.json()
    except Exception:
        return {"status": "error", "message": "Invalid JSON body"}

    response_payload = process_telegram_update(update, db)
    return response_payload


@router.post(
    "/simulate",
    response_model=StandardResponse[TelegramSimulateResponse],
    summary="Simulate Telegram Bot conversation for testing & web preview",
)
def simulate_telegram_chat(
    req: TelegramSimulateRequest,
    db: Session = Depends(get_db),
):
    """
    Allows the frontend Telegram Simulator and automated tests to preview
    exactly what a student sees on Telegram when querying their case reference ID.
    """
    fake_update = {
        "update_id": 100001,
        "message": {
            "message_id": 1,
            "from": {
                "id": req.chat_id,
                "is_bot": False,
                "first_name": req.first_name,
                "username": req.first_name.lower() if req.first_name else "student",
            },
            "chat": {
                "id": req.chat_id,
                "first_name": req.first_name,
                "type": "private",
            },
            "date": 1700000000,
            "text": req.message,
        }
    }

    resp = process_telegram_update(fake_update, db)
    reply_html = resp.get("text", "No response generated")
    extracted_ref = extract_case_reference(req.message)

    return StandardResponse(
        data=TelegramSimulateResponse(
            message_sent=req.message,
            reply_html=reply_html,
            extracted_case_ref=extracted_ref,
            chat_id=req.chat_id or 99999999,
            parse_mode=resp.get("parse_mode", "HTML"),
        ),
        success=True,
    )


@router.get(
    "/info",
    response_model=StandardResponse[TelegramBotInfo],
    summary="Telegram Bot setup instructions and metadata",
)
def get_telegram_bot_info():
    """Returns Telegram Bot details, status, and webhook configuration guidelines."""
    is_set = bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_BOT_TOKEN != "DEMO_TELEGRAM_BOT_TOKEN")
    
    return StandardResponse(
        data=TelegramBotInfo(
            bot_name="AICTE Grievance Status Tracker Bot",
            bot_username="@aicte_grievance_bot",
            is_configured=is_set,
            webhook_url_example="/api/v1/telegram/webhook",
            commands=[
                {"command": "/start", "description": "Welcome message and usage instructions"},
                {"command": "/help", "description": "Guidance on how to format case references"},
                {"command": "/status <ref_id>", "description": "Direct case status query command"},
            ],
            supported_formats=[
                "AIC-2026-0001",
                "AIC-2026-0015",
                "MT-1A2B3C4D (Master Ticket)",
                "Plain text (e.g. 'Status of AIC-2026-0002')",
            ]
        ),
        success=True,
    )
