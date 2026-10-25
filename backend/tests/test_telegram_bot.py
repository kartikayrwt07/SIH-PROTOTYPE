"""
Tests for Telegram Bot Grievance Tracker Webhook and Simulator.
"""

import html
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.case import ComplaintCase
from backend.app.services.telegram_bot import (
    extract_case_reference,
    format_welcome_message,
    process_telegram_update,
)

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_extract_case_reference():
    """Verify regex extraction of case references across formats."""
    assert extract_case_reference("AIC-2026-0001") == "AIC-2026-0001"
    assert extract_case_reference("aic-2026-0005") == "AIC-2026-0005"
    assert extract_case_reference("/status AIC-2026-0010") == "AIC-2026-0010"
    assert extract_case_reference("Hi please check status of AIC-2026-0015 thanks") == "AIC-2026-0015"
    assert extract_case_reference("MT-A1B2C3D4") == "MT-A1B2C3D4"
    assert extract_case_reference("hello") is None
    assert extract_case_reference("") is None


def test_telegram_welcome_message(db: Session):
    """Verify /start returns welcome instructions."""
    update = {
        "update_id": 1,
        "message": {
            "message_id": 1,
            "chat": {"id": 12345},
            "from": {"first_name": "Rohan"},
            "text": "/start",
        }
    }
    response = process_telegram_update(update, db)
    assert response["method"] == "sendMessage"
    assert response["chat_id"] == 12345
    assert "AICTE Grievance Status Tracker Bot" in response["text"]
    assert "Rohan" in response["text"]


def test_telegram_case_lookup_success(db: Session):
    """Verify texting a valid Case Reference ID returns real-time status."""
    first_case = db.query(ComplaintCase).first()
    assert first_case is not None, "At least one case must exist in DB for test"

    update = {
        "update_id": 2,
        "message": {
            "message_id": 2,
            "chat": {"id": 98765},
            "from": {"first_name": "Aarav"},
            "text": f"Status of {first_case.case_reference_id}",
        }
    }
    response = process_telegram_update(update, db)
    assert response["method"] == "sendMessage"
    assert response["chat_id"] == 98765
    assert first_case.case_reference_id in response["text"]
    assert "Current Status:" in response["text"]
    assert html.escape(first_case.category) in response["text"]


def test_telegram_case_lookup_not_found(db: Session):
    """Verify querying an invalid case ID gives helpful feedback."""
    update = {
        "update_id": 3,
        "message": {
            "message_id": 3,
            "chat": {"id": 11111},
            "from": {"first_name": "Neha"},
            "text": "AIC-9999-9999",
        }
    }
    response = process_telegram_update(update, db)
    assert response["method"] == "sendMessage"
    assert "Case ID Not Found" in response["text"]
    assert "AIC-9999-9999" in response["text"]


def test_telegram_webhook_api():
    """Verify POST /api/v1/telegram/webhook returns valid Telegram response payload."""
    payload = {
        "update_id": 100,
        "message": {
            "message_id": 5,
            "chat": {"id": 44444},
            "from": {"first_name": "Priya"},
            "text": "/help",
        }
    }
    res = client.post("/api/v1/telegram/webhook", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["method"] == "sendMessage"
    assert data["chat_id"] == 44444
    assert "AICTE Grievance Status Tracker" in data["text"]


def test_telegram_simulate_api(db: Session):
    """Verify POST /api/v1/telegram/simulate endpoint."""
    first_case = db.query(ComplaintCase).first()
    ref = first_case.case_reference_id if first_case else "AIC-2026-0001"

    res = client.post(
        "/api/v1/telegram/simulate",
        json={"message": ref, "first_name": "Kartik"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["success"] is True
    assert payload["data"]["extracted_case_ref"] == ref.upper()
    assert "AICTE" in payload["data"]["reply_html"]


def test_telegram_info_api():
    """Verify GET /api/v1/telegram/info metadata."""
    res = client.get("/api/v1/telegram/info")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["bot_name"] == "AICTE Grievance Status Tracker Bot"
    assert len(data["commands"]) >= 2
