"""
Telegram Bot Long-Polling Daemon for Local & Development Environments.

Continuously polls Telegram Bot API for incoming messages from students,
resolves their Case Reference IDs against the real-time AICTE database,
and sends the formatted status card back to their Telegram chat.
"""

import sys
import time
import json
import logging
import urllib.request
import urllib.error
from typing import Optional

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.services.telegram_bot import process_telegram_update

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("telegram_poller")


def send_telegram_message(token: str, chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
    """Sends an outbound message to a Telegram chat via Bot API."""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            return res_data.get("ok", False)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        logger.error(f"Telegram API HTTP error {e.code}: {err_body}")
        return False
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")
        return False


def run_poller(bot_token: Optional[str] = None):
    """Main long-polling loop."""
    token = bot_token or settings.TELEGRAM_BOT_TOKEN
    if not token:
        logger.error("No TELEGRAM_BOT_TOKEN found in environment or config!")
        sys.exit(1)

    # 1. Verify Bot Identity
    try:
        me_url = f"https://api.telegram.org/bot{token}/getMe"
        with urllib.request.urlopen(me_url, timeout=10) as res:
            me_info = json.loads(res.read().decode("utf-8"))
            bot_username = me_info.get("result", {}).get("username", "UnknownBot")
            logger.info(f"Connected to Telegram Bot: @{bot_username}")
    except Exception as e:
        logger.error(f"Could not connect to Telegram Bot API: {e}")
        sys.exit(1)

    # 2. Delete any webhook to enable getUpdates polling
    try:
        del_wh_url = f"https://api.telegram.org/bot{token}/deleteWebhook"
        with urllib.request.urlopen(del_wh_url, timeout=10) as res:
            logger.info("Cleared any existing webhooks to ensure polling works.")
    except Exception as e:
        logger.warning(f"deleteWebhook notice: {e}")

    logger.info("Telegram Bot Polling Daemon started. Listening for student queries...")
    offset = 0

    while True:
        try:
            updates_url = f"https://api.telegram.org/bot{token}/getUpdates?offset={offset}&timeout=25"
            with urllib.request.urlopen(updates_url, timeout=35) as res:
                response = json.loads(res.read().decode("utf-8"))

            if not response.get("ok"):
                logger.warning(f"Telegram returned error: {response}")
                time.sleep(3)
                continue

            updates = response.get("result", [])
            for update in updates:
                update_id = update["update_id"]
                offset = update_id + 1

                msg = update.get("message") or update.get("edited_message")
                if not msg:
                    continue

                user = msg.get("from", {})
                chat = msg.get("chat", {})
                chat_id = chat.get("id")
                first_name = user.get("first_name", "Student")
                username = user.get("username", "")
                text = msg.get("text", "")

                logger.info(f"Incoming message from {first_name} (@{username}, chat={chat_id}): '{text}'")

                # Process through existing Telegram grievance bot engine
                db = SessionLocal()
                try:
                    result = process_telegram_update(update, db)
                finally:
                    db.close()

                if result.get("method") == "sendMessage":
                    reply_text = result.get("text", "")
                    parse_mode = result.get("parse_mode", "HTML")
                    success = send_telegram_message(token, chat_id, reply_text, parse_mode)
                    if success:
                        logger.info(f"Successfully sent reply to chat {chat_id}")
                    else:
                        logger.warning(f"Failed to deliver reply to chat {chat_id}")

        except urllib.error.URLError as e:
            logger.warning(f"Network error in polling loop: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Stopping Telegram poller.")
            break
        except Exception as e:
            logger.exception(f"Unexpected error in polling loop: {e}")
            time.sleep(3)


if __name__ == "__main__":
    token = sys.argv[1] if len(sys.argv) > 1 else None
    run_poller(token)
