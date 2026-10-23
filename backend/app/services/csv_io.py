import io
import csv
import uuid
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.case import ComplaintCase, CaseStatus, CasePriority
from backend.app.models.bureau import Bureau
from backend.app.models.institution import Institution
from backend.app.models.user import User, UserRole
from backend.app.models.audit import CaseAuditEvent, AuditEventType
from backend.app.services.sla import calculate_sla_deadline
from backend.app.schemas.csv_io import (
    CsvRowError,
    CsvRowPreview,
    CsvPreviewResponse,
    CsvCommitResponse,
)


def generate_case_reference(db: Session) -> str:
    """Generate next stable case reference ID in format AICTE-YYYY-XXXX."""
    current_year = datetime.now(timezone.utc).year
    prefix = f"AICTE-{current_year}-"

    # Query existing cases with prefix
    latest_cases = (
        db.query(ComplaintCase.case_reference_id)
        .filter(ComplaintCase.case_reference_id.like(f"{prefix}%"))
        .all()
    )

    max_num = 1000
    for (ref,) in latest_cases:
        try:
            parts = ref.split("-")
            if len(parts) >= 3 and parts[2].isdigit():
                val = int(parts[2])
                if val > max_num:
                    max_num = val
        except Exception:
            continue

    return f"{prefix}{max_num + 1}"


def _normalize_header(header: str) -> str:
    """Normalize CSV column header names."""
    h = header.strip().lower()
    h = re.sub(r"[_\s\-]+", "_", h)
    return h


def parse_and_validate_csv(db: Session, csv_content: str) -> CsvPreviewResponse:
    """Parse CSV text, validate headers, fields, and entities, returning a dry-run preview."""
    if not csv_content or not csv_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty.",
        )

    # Strip BOM if present
    content = csv_content.lstrip("\ufeff")
    stream = io.StringIO(content)
    reader = csv.reader(stream)

    try:
        raw_headers = next(reader)
    except StopIteration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file contains no header row.",
        )

    normalized_headers = [_normalize_header(h) for h in raw_headers]

    # Required column mappings
    header_map = {}
    for idx, norm_h in enumerate(normalized_headers):
        if "subject" in norm_h:
            header_map["subject"] = idx
        elif "desc" in norm_h:
            header_map["description"] = idx
        elif "bureau" in norm_h:
            header_map["bureau_code"] = idx
        elif "inst" in norm_h or "aicte_id" in norm_h or "permanent_id" in norm_h:
            header_map["institution_aicte_id"] = idx
        elif "cat" in norm_h:
            header_map["category"] = idx
        elif "prior" in norm_h:
            header_map["priority"] = idx
        elif "confid" in norm_h or "secret" in norm_h:
            header_map["is_confidential"] = idx

    missing_cols = []
    for req in ["subject", "description", "bureau_code", "institution_aicte_id", "category"]:
        if req not in header_map:
            missing_cols.append(req)

    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV missing mandatory column(s): {', '.join(missing_cols)}. Expected headers: subject, description, bureau_code, institution_aicte_id, category.",
        )

    # Load cache of bureaus and institutions
    bureaus = db.query(Bureau).all()
    bureau_by_code = {b.code.upper().strip(): b for b in bureaus}

    institutions = db.query(Institution).all()
    inst_by_id = {i.aicte_permanent_id.upper().strip(): i for i in institutions}
    inst_by_name = {i.name.lower().strip(): i for i in institutions}

    # Load existing cases for duplicate checking
    existing_cases = db.query(ComplaintCase.case_reference_id, ComplaintCase.subject).all()
    existing_subjects = {c.subject.lower().strip(): c.case_reference_id for c in existing_cases}

    preview_rows: List[CsvRowPreview] = []
    valid_count = 0
    invalid_count = 0

    for row_idx, row in enumerate(reader, start=1):
        if not row or all(not str(cell).strip() for cell in row):
            continue  # skip completely blank rows

        def get_val(key: str, default: str = "") -> str:
            col_idx = header_map.get(key)
            if col_idx is not None and col_idx < len(row):
                return str(row[col_idx]).strip()
            return default

        subject = get_val("subject")
        description = get_val("description")
        bureau_code_raw = get_val("bureau_code").upper()
        inst_id_raw = get_val("institution_aicte_id")
        category = get_val("category")
        priority_raw = get_val("priority", "MEDIUM").upper()
        is_confidential_raw = get_val("is_confidential", "false").lower()

        is_confidential = is_confidential_raw in ["true", "1", "yes", "y"]

        errors: List[CsvRowError] = []
        warnings: List[str] = []
        duplicate_ref: Optional[str] = None

        # 1. Subject validation
        if not subject:
            errors.append(CsvRowError(row_number=row_idx, field="subject", message="Subject is required."))
        elif len(subject) < 5:
            errors.append(CsvRowError(row_number=row_idx, field="subject", message="Subject must be at least 5 characters."))

        # 2. Description validation
        if not description:
            errors.append(CsvRowError(row_number=row_idx, field="description", message="Description is required."))
        elif len(description) < 10:
            errors.append(CsvRowError(row_number=row_idx, field="description", message="Description must be at least 10 characters."))

        # 3. Bureau validation
        matched_bureau = bureau_by_code.get(bureau_code_raw)
        if not matched_bureau:
            valid_codes = ", ".join(sorted(bureau_by_code.keys()))
            errors.append(
                CsvRowError(
                    row_number=row_idx,
                    field="bureau_code",
                    message=f"Unknown bureau code '{bureau_code_raw}'. Recognized codes: {valid_codes}.",
                )
            )

        # 4. Institution validation
        matched_inst = inst_by_id.get(inst_id_raw.upper()) or inst_by_name.get(inst_id_raw.lower())
        if not matched_inst:
            errors.append(
                CsvRowError(
                    row_number=row_idx,
                    field="institution_aicte_id",
                    message=f"Institution '{inst_id_raw}' not found in AICTE registered institutions registry.",
                )
            )

        # 5. Category validation
        if not category:
            errors.append(CsvRowError(row_number=row_idx, field="category", message="Category is required."))

        # 6. Priority validation
        valid_priorities = [p.value for p in CasePriority]
        if priority_raw not in valid_priorities:
            errors.append(
                CsvRowError(
                    row_number=row_idx,
                    field="priority",
                    message=f"Invalid priority '{priority_raw}'. Allowed: {', '.join(valid_priorities)}.",
                )
            )

        # 7. Duplicate warning
        if subject and subject.lower().strip() in existing_subjects:
            dup_ref = existing_subjects[subject.lower().strip()]
            duplicate_ref = dup_ref
            warnings.append(f"Potential duplicate of existing case {dup_ref} (matching subject line).")

        is_valid = len(errors) == 0
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        preview_rows.append(
            CsvRowPreview(
                row_number=row_idx,
                is_valid=is_valid,
                institution_aicte_id=inst_id_raw,
                institution_name=matched_inst.name if matched_inst else None,
                bureau_code=bureau_code_raw,
                bureau_name=matched_bureau.name if matched_bureau else None,
                subject=subject,
                category=category,
                priority=priority_raw if priority_raw in valid_priorities else "MEDIUM",
                is_confidential=is_confidential,
                description=description,
                errors=errors,
                warnings=warnings,
                duplicate_case_ref=duplicate_ref,
            )
        )

    return CsvPreviewResponse(
        total_rows=len(preview_rows),
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        can_commit=valid_count > 0,
        rows=preview_rows,
    )


def commit_csv_batch(
    db: Session,
    rows: List[Dict[str, Any]],
    current_user: User,
    skip_invalid: bool = True,
) -> CsvCommitResponse:
    """Commit pre-validated CSV rows inside an atomic database transaction."""
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rows provided for batch commitment.",
        )

    bureaus = {b.code.upper().strip(): b for b in db.query(Bureau).all()}
    institutions_by_id = {i.aicte_permanent_id.upper().strip(): i for i in db.query(Institution).all()}
    institutions_by_name = {i.name.lower().strip(): i for i in db.query(Institution).all()}

    imported_count = 0
    skipped_count = 0
    created_references: List[str] = []

    now = datetime.now(timezone.utc)

    # Use atomic block
    try:
        for idx, row in enumerate(rows, start=1):
            subject = str(row.get("subject", "")).strip()
            description = str(row.get("description", "")).strip()
            bureau_code = str(row.get("bureau_code", "")).upper().strip()
            inst_id = str(row.get("institution_aicte_id", "")).strip()
            category = str(row.get("category", "")).strip()
            priority_val = str(row.get("priority", "MEDIUM")).upper().strip()
            is_confidential = bool(row.get("is_confidential", False))

            bureau = bureaus.get(bureau_code)
            institution = institutions_by_id.get(inst_id.upper()) or institutions_by_name.get(inst_id.lower())

            # Row validity check
            if not subject or not description or not bureau or not institution or not category:
                if skip_invalid:
                    skipped_count += 1
                    continue
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Row {idx} contains invalid or unresolved entity references.",
                    )

            priority_enum = getattr(CasePriority, priority_val, CasePriority.MEDIUM)

            case_ref = generate_case_reference(db)
            due_date = calculate_sla_deadline(db, category, priority_enum, start_time=now)

            if is_confidential:
                desc_conf = description
                desc_redacted = "[REDACTED - CONFIDENTIAL GRIEVANCE]: Details restricted to authorized review officers."
            else:
                desc_conf = None
                desc_redacted = description

            new_case = ComplaintCase(
                id=str(uuid.uuid4()),
                case_reference_id=case_ref,
                institution_id=institution.id,
                bureau_id=bureau.id,
                assigned_officer_id=None,
                subject=subject,
                description_redacted=desc_redacted,
                description_confidential=desc_conf,
                category=category,
                priority=priority_enum,
                status=CaseStatus.REGISTERED,
                due_date=due_date,
                escalation_level=0,
                created_at=now,
                updated_at=now,
            )
            db.add(new_case)
            db.flush()

            # Record audit event
            audit_event = CaseAuditEvent(
                id=str(uuid.uuid4()),
                case_id=new_case.id,
                actor_id=current_user.id if current_user else None,
                actor_role=current_user.role.value if current_user else "SYSTEM",
                event_type=AuditEventType.REGISTERED,
                previous_state=None,
                new_state=CaseStatus.REGISTERED.value,
                metadata_json={
                    "source": "CSV_BATCH_INGESTION",
                    "row_number": row.get("row_number", idx),
                    "priority": priority_val,
                },
                timestamp=now,
            )
            db.add(audit_event)

            imported_count += 1
            created_references.append(case_ref)

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch ingestion transaction aborted: {str(e)}",
        )

    return CsvCommitResponse(
        imported_count=imported_count,
        skipped_count=skipped_count,
        failed_count=0,
        created_case_references=created_references,
    )


def export_cases_to_csv(cases: List[ComplaintCase], current_user: User) -> str:
    """Generate RFC 4180 compliant CSV content with role-scoped confidentiality redaction."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header Row
    headers = [
        "Case Reference ID",
        "Institution AICTE ID",
        "Institution Name",
        "State",
        "District",
        "Bureau Code",
        "Bureau Name",
        "Subject",
        "Category",
        "Priority",
        "Status",
        "Escalation Level",
        "Target Due Date",
        "Created At",
        "Resolved At",
        "Grievance Description",
    ]
    writer.writerow(headers)

    can_view_confidential = current_user.role in [UserRole.ADMIN, UserRole.SUPERVISOR]

    for c in cases:
        # Confidentiality redaction
        if can_view_confidential and c.description_confidential:
            description_text = c.description_confidential
        else:
            description_text = c.description_redacted or ""

        inst_id = c.institution.aicte_permanent_id if c.institution else ""
        inst_name = c.institution.name if c.institution else ""
        inst_state = c.institution.state if c.institution else ""
        inst_district = c.institution.district if c.institution else ""
        bureau_code = c.bureau.code if c.bureau else ""
        bureau_name = c.bureau.name if c.bureau else ""

        due_date_str = c.due_date.isoformat() if c.due_date else ""
        created_at_str = c.created_at.isoformat() if c.created_at else ""
        resolved_at_str = c.resolved_at.isoformat() if c.resolved_at else ""

        writer.writerow(
            [
                c.case_reference_id,
                inst_id,
                inst_name,
                inst_state,
                inst_district,
                bureau_code,
                bureau_name,
                c.subject,
                c.category,
                c.priority.value if hasattr(c.priority, "value") else str(c.priority),
                c.status.value if hasattr(c.status, "value") else str(c.status),
                c.escalation_level,
                due_date_str,
                created_at_str,
                resolved_at_str,
                description_text,
            ]
        )

    return output.getvalue()
