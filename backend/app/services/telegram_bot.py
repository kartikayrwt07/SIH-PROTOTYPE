"""
Telegram Bot Tracker Service — Real-time student grievance status over Telegram.

Students can text their Case Reference ID (e.g., AIC-2026-0001) or Master Ticket ID (e.g. MT-XXXXXXXX)
to the AICTE Telegram Bot and instantly receive real-time case status, SLA timeline,
institution/bureau details, and resolution remarks without needing to log in.
"""

import re
import html
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.case import ComplaintCase, CaseStatus
from backend.app.models.master_ticket import MasterTicket
from backend.app.models.institution import Institution
from backend.app.models.bureau import Bureau


CASE_REF_REGEX = re.compile(
    r"\b(AIC(?:TE)?-[A-Z0-9-]+|MT-[A-Z0-9-]+)\b",
    re.IGNORECASE
)

STATUS_ICONS = {
    "Received": "📥",
    "In Progress": "⚙️",
    "Under Review": "🔍",
    "Awaiting Information": "⏳",
    "Resolved": "✅",
    "Closed": "📁",
    "Open": "📬",
}


def extract_case_reference(text: str) -> Optional[str]:
    """
    Extracts a Case Reference ID or Master Ticket ID from user message.
    Supports formats like:
      - 'AICTE-2026-1001'
      - 'AIC-2026-1001'
      - '/status AICTE-2026-1001'
      - 'What is the status of AICTE-2026-1002?'
      - 'MT-DD4A3444'
      - '1001'
    """
    if not text:
        return None

    cleaned = text.strip()

    # Direct command like /status AICTE-2026-1001
    if cleaned.startswith("/status"):
        parts = cleaned.split()
        if len(parts) > 1:
            return parts[1].strip().upper()

    # Search for regex match (AIC-..., AICTE-..., MT-...)
    match = CASE_REF_REGEX.search(cleaned)
    if match:
        return match.group(1).upper()

    # If the user typed a 4-6 digit complaint number like "1001"
    num_match = re.search(r"\b(\d{4,6})\b", cleaned)
    if num_match:
        return f"AICTE-2026-{num_match.group(1)}"

    # If the user typed a raw alphanumeric case ref directly
    if re.match(r"^[A-Za-z0-9-]+$", cleaned) and (any(c.isdigit() for c in cleaned) or "-" in cleaned) and len(cleaned) >= 4:
        return cleaned.upper()

    return None


def format_welcome_message(first_name: Optional[str] = None) -> str:
    """Generates the welcome message for /start or /help."""
    greeting = f"Namaste {html.escape(first_name)}! 🙏" if first_name else "Namaste! 🙏"
    return (
        f"<b>{greeting}</b>\n\n"
        "🏛️ <b>AICTE Grievance Status Tracker Bot (@aictesih_bot)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "Check your grievance case status instantly without logging into any web portal.\n\n"
        "👉 <b>How to check:</b>\n"
        "Simply text your <b>Case Reference ID</b> or <b>Master Ticket ID</b> to this chat.\n\n"
        "<i>Working Examples to try:</i>\n"
        "• <code>AICTE-2026-1001</code> (Tuition Fee Dispute)\n"
        "• <code>AICTE-2026-1003</code> (Hostel Ragging Incident)\n"
        "• <code>MT-DD4A3444</code> (Master Ticket Cluster)\n"
        "• <code>/status AICTE-2026-1002</code>\n\n"
        "🔒 <i>Note: Complainant confidential personal details (PII) are strictly masked for student privacy.</i>"
    )


def format_case_status_message(case: ComplaintCase, db: Session) -> str:
    """Formats a ComplaintCase into a rich, informative Telegram HTML message."""
    status_str = case.status.value if hasattr(case.status, "value") else str(case.status)
    icon = STATUS_ICONS.get(status_str, "📋")

    inst_name = case.institution.name if case.institution else "Technical Institution"
    inst_aicte_id = case.institution.aicte_permanent_id if case.institution else "N/A"
    bureau_code = case.bureau.code if case.bureau else "AICTE Cell"
    bureau_name = case.bureau.name if case.bureau else "Competent Authority"

    priority_str = case.priority.value if hasattr(case.priority, "value") else str(case.priority)

    # Date formatting
    created_str = case.created_at.strftime("%d %b %Y, %I:%M %p") if case.created_at else "N/A"
    due_str = case.due_date.strftime("%d %b %Y") if case.due_date else "Standard SLA"

    # SLA and escalation status
    escalation_text = "Standard SLA Priority"
    if case.escalation_level == 1:
        escalation_text = "⚠️ Approaching SLA Deadline"
    elif case.escalation_level >= 2:
        escalation_text = "🚨 Overdue SLA Escalation"

    msg = [
        "🏛️ <b>AICTE Grievance Case Status</b>",
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"🔖 <b>Case ID:</b> <code>{html.escape(case.case_reference_id)}</code>",
        f"📌 <b>Category:</b> {html.escape(case.category)}",
        f"📋 <b>Subject:</b> {html.escape(case.subject[:140])}",
        "",
        f"🏫 <b>Institution:</b> {html.escape(inst_name)}",
        f"🆔 <b>AICTE Permanent ID:</b> <code>{html.escape(inst_aicte_id)}</code>",
        f"🏢 <b>Assigned Bureau:</b> {html.escape(bureau_code)} — {html.escape(bureau_name)}",
        "",
        "📊 <b>Current Status:</b>",
        f"<b>{icon} {html.escape(status_str.upper())}</b> ({html.escape(escalation_text)})",
        f"⚡ <b>Priority:</b> {html.escape(priority_str)}",
        f"📅 <b>Filed On:</b> {created_str}",
        f"⏳ <b>Target SLA Due:</b> {due_str}",
    ]

    # If resolved, add resolution remarks
    if status_str == "Resolved" or case.resolved_at:
        resolved_str = case.resolved_at.strftime("%d %b %Y, %I:%M %p") if case.resolved_at else "Recently"
        remarks = case.closure_remarks or "Grievance resolved following institutional inquiry and directive."
        msg.extend([
            "",
            "━━━━━━━━━━━━━━━━━━━━━━",
            f"✅ <b>Resolution Confirmed on {resolved_str}</b>",
            f"<i>\"{html.escape(remarks)}\"</i>",
        ])
    elif case.description_redacted:
        # Show public redacted description excerpt
        summary = (case.description_redacted[:120] + "...") if len(case.description_redacted) > 120 else case.description_redacted
        msg.extend([
            "",
            f"📝 <b>Case Summary:</b> {html.escape(summary)}",
        ])

    msg.extend([
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "💡 <i>To check another case, simply send its Case ID.</i>"
    ])

    return "\n".join(msg)


def format_master_ticket_message(master: MasterTicket) -> str:
    """Formats a MasterTicket status into a Telegram HTML message."""
    status_str = master.status.value if hasattr(master.status, "value") else str(master.status)
    icon = STATUS_ICONS.get(status_str, "📬")
    inst_name = master.institution.name if master.institution else "Institution"

    msg = [
        "👥 <b>AICTE Master Ticket Status (Grouped Case)</b>",
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"🔖 <b>Master Ticket ID:</b> <code>{html.escape(master.ticket_reference_id)}</code>",
        f"📌 <b>Category:</b> {html.escape(master.category)}",
        f"📋 <b>Group Subject:</b> {html.escape(master.consolidated_subject)}",
        "",
        f"🏫 <b>Institution:</b> {html.escape(inst_name)}",
        f"👥 <b>Grouped Complaints:</b> {master.child_count} students consolidated",
        "",
        "📊 <b>Current Status:</b>",
        f"<b>{icon} {html.escape(status_str.upper())}</b>",
    ]

    if status_str == "Resolved" and master.resolution_remarks:
        msg.extend([
            "",
            "━━━━━━━━━━━━━━━━━━━━━━",
            "✅ <b>Bulk Resolution Directives:</b>",
            f"<i>\"{html.escape(master.resolution_remarks)}\"</i>",
            f"⏱️ <i>Administrative time saved: {master.time_saved_hours:.1f} hours</i>",
        ])

    msg.extend([
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "💡 <i>All member complaints receive updates simultaneously when this ticket is updated.</i>"
    ])

    return "\n".join(msg)


def process_telegram_update(update: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    Core processor for incoming Telegram webhook update.
    Returns the JSON dictionary compatible with Telegram webhook response
    method (sendMessage), which automatically sends the reply to the chat!
    """
    message = update.get("message") or update.get("edited_message")
    if not message:
        return {"status": "ignored_no_message"}

    chat = message.get("chat", {})
    chat_id = chat.get("id")
    if not chat_id:
        return {"status": "ignored_no_chat_id"}

    from_user = message.get("from", {})
    first_name = from_user.get("first_name", "")
    text = (message.get("text") or "").strip()

    # 1. Handle commands: /start, /help
    if text.lower() in ["/start", "/help", "hi", "hello", "help"]:
        reply_text = format_welcome_message(first_name)
        return {
            "method": "sendMessage",
            "chat_id": chat_id,
            "text": reply_text,
            "parse_mode": "HTML",
        }

    # 2. Extract Case Reference
    case_ref = extract_case_reference(text)

    if not case_ref:
        reply_text = (
            f"👋 Hi {html.escape(first_name)}!\n\n"
            "I couldn't identify a valid Case Reference ID in your message.\n\n"
            "Please send a format like: <code>AIC-2026-0001</code> or <code>MT-XXXXXXXX</code>.\n"
            "Send /help for instructions."
        )
        return {
            "method": "sendMessage",
            "chat_id": chat_id,
            "text": reply_text,
            "parse_mode": "HTML",
        }

    # 3. Query Database for ComplaintCase (Flexible prefix & number matching)
    case = db.query(ComplaintCase).filter(
        ComplaintCase.case_reference_id.ilike(case_ref)
    ).first()

    if not case and case_ref.startswith("AIC-"):
        # Try with AICTE- prefix
        alt_ref = "AICTE-" + case_ref[4:]
        case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id.ilike(alt_ref)).first()

    if not case and case_ref.startswith("AICTE-"):
        # Try with AIC- prefix
        alt_ref = "AIC-" + case_ref[6:]
        case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id.ilike(alt_ref)).first()

    if not case:
        # Match trailing digits e.g. 1001
        digits = re.findall(r"\d+", case_ref)
        if digits:
            case = db.query(ComplaintCase).filter(ComplaintCase.case_reference_id.ilike(f"%{digits[-1]}")).first()

    if case:
        reply_text = format_case_status_message(case, db)
        return {
            "method": "sendMessage",
            "chat_id": chat_id,
            "text": reply_text,
            "parse_mode": "HTML",
        }

    # 4. Check if it's a Master Ticket
    master = db.query(MasterTicket).filter(
        MasterTicket.ticket_reference_id.ilike(case_ref)
    ).first()

    if not master and not case_ref.startswith("MT-"):
        master = db.query(MasterTicket).filter(
            MasterTicket.ticket_reference_id.ilike(f"MT-{case_ref}")
        ).first()

    if master:
        reply_text = format_master_ticket_message(master)
        return {
            "method": "sendMessage",
            "chat_id": chat_id,
            "text": reply_text,
            "parse_mode": "HTML",
        }

    # 5. Case not found in database
    reply_text = (
        f"🔍 <b>Case ID Not Found:</b> <code>{html.escape(case_ref)}</code>\n\n"
        "We could not find any active or historical grievance matching this reference number.\n\n"
        "<b>Try these sample active cases from the system:</b>\n"
        "• <code>AICTE-2026-1001</code> (Tuition Fee Hike Dispute)\n"
        "• <code>AICTE-2026-1003</code> (Hostel Ragging Complaint)\n"
        "• <code>MT-DD4A3444</code> (Master Ticket - 15 Grouped Cases)\n\n"
        "<i>Reference IDs are case-insensitive. Send /help for instructions.</i>"
    )

    return {
        "method": "sendMessage",
        "chat_id": chat_id,
        "text": reply_text,
        "parse_mode": "HTML",
    }
