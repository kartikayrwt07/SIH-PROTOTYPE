"""
Generative Legal Paperwork Engine for AICTE Regulatory Oversight.

Produces court-admissible, officially formatted PDF documents for:
- Statutory Show-Cause Notices (under Section 10(1)(v) of AICTE Act, 1987)
- Executive Directives for Academic Intake Quota Freeze (Regulation 4.3 AICTE APH)
- Mandatory Surprise On-Site Inspection Notices

Uses ReportLab to render vector-sharp, professional legal documentation
with official ministry letterheads, citation ledgers, operative clauses, and seal blocks.
"""

import io
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)


def generate_regulatory_pdf(
    institution: Dict[str, Any],
    trust_score_detail: Optional[Dict[str, Any]] = None,
    action_type: str = "SHOW_CAUSE_NOTICE",
    directive_notes: Optional[str] = None,
    reference_number: Optional[str] = None,
    issued_date: Optional[str] = None,
) -> bytes:
    """
    Generates a legally formatted PDF Show-Cause Notice or Intake Freeze Directive.
    
    Returns raw PDF bytes suitable for StreamingResponse or saving to disk/cloud storage.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36,
    )

    now_ts = datetime.now(timezone.utc)
    inst_name = institution.get("name", "Unknown Institution")
    aicte_id = institution.get("aicte_permanent_id", "N/A")
    state = institution.get("state", "India")
    district = institution.get("district", "")
    inst_type = institution.get("institution_type", "Technical Institution")

    score = 0
    grade = "C"
    risk_tier = "Tier 6 (Critical Red Zone)"
    citations = []

    if trust_score_detail:
        score = trust_score_detail.get("trust_score", 0)
        grade = trust_score_detail.get("trust_grade", "C")
        risk_tier = trust_score_detail.get("risk_tier", "Tier 6 (Critical Red Zone)")
        citations = trust_score_detail.get("citations", [])

    ref_no = reference_number or f"AICTE/REG/{now_ts.strftime('%Y%m')}/{aicte_id}"
    date_str = issued_date or now_ts.strftime("%d %B %Y")

    # Determine Notice Type
    action_upper = (action_type or "").upper()
    is_freeze = "FREEZE" in action_upper
    is_inspection = "INSPECTION" in action_upper and not is_freeze

    if is_freeze:
        doc_title = "EXECUTIVE DIRECTIVE: IMMEDIATE FREEZE OF ACADEMIC INTAKE QUOTA"
        doc_statute = "ISSUED UNDER REGULATION 4.3 OF AICTE APPROVAL PROCESS HANDBOOK & SECTION 10(1)(p) OF AICTE ACT, 1987"
        header_color = colors.HexColor("#7B1113")  # Deep Crimson
    elif is_inspection:
        doc_title = "STATUTORY ORDER: CONSTITUTION OF SPECIAL FACT-FINDING INSPECTION PANEL"
        doc_statute = "ISSUED UNDER SECTION 11 OF THE ALL INDIA COUNCIL FOR TECHNICAL EDUCATION ACT, 1987"
        header_color = colors.HexColor("#1A237E")  # Deep Navy
    else:
        doc_title = "STATUTORY SHOW-CAUSE NOTICE"
        doc_statute = "ISSUED UNDER SECTION 10(1)(v) READ WITH SECTION 11 OF THE AICTE ACT, 1987"
        header_color = colors.HexColor("#4A154B")  # Deep Plum / Royal

    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "NoticeTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        alignment=1,  # Center
        textColor=header_color,
    )
    
    statute_style = ParagraphStyle(
        "StatuteSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        alignment=1,
        textColor=colors.HexColor("#424242"),
    )
    
    header_org = ParagraphStyle(
        "MinistryHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#0D1B2A"),
    )

    header_sub = ParagraphStyle(
        "MinistrySub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        alignment=1,
        textColor=colors.HexColor("#555555"),
    )

    legal_meta = ParagraphStyle(
        "LegalMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1E1E1E"),
    )

    legal_meta_bold = ParagraphStyle(
        "LegalMetaBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1E1E1E"),
    )

    body_style = ParagraphStyle(
        "LegalBody",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=9.5,
        leading=13.5,
        alignment=4,  # Justify
        textColor=colors.HexColor("#111111"),
    )

    body_bold = ParagraphStyle(
        "LegalBodyBold",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=9.5,
        leading=13.5,
        alignment=4,
        textColor=colors.HexColor("#111111"),
    )

    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#222222"),
    )

    story = []

    # 1. Ministry & Council Masthead
    story.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", header_org))
    story.append(Paragraph("(A STATUTORY BODY OF THE GOVERNMENT OF INDIA, MINISTRY OF EDUCATION)", header_sub))
    story.append(Paragraph("Nelson Mandela Marg, Vasant Kunj, New Delhi – 110070 | www.aicte-india.org | Tel: 011-29581000", header_sub))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=header_color, spaceAfter=8))

    # 2. Reference & Dispatch Information Bar
    dispatch_table_data = [
        [
            Paragraph(f"<b>Dispatch Ref. No.:</b> {ref_no}", legal_meta),
            Paragraph(f"<b>Date of Issuance:</b> {date_str}", legal_meta),
        ],
        [
            Paragraph("<b>Transmission Mode:</b> Speed Post with A/D & Central E-Portal Server", legal_meta),
            Paragraph("<b>Classification:</b> <font color='red'><b>CONFIDENTIAL / STATUTORY PROCEEDING</b></font>", legal_meta),
        ],
    ]
    disp_table = Table(dispatch_table_data, colWidths=[310, 205])
    disp_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(disp_table)
    story.append(Spacer(1, 8))

    # 3. Addressee Block
    address_lines = [
        f"<b>TO:</b>",
        f"The Chairman / President, Governing Board &",
        f"The Principal / Director,",
        f"<b>{inst_name}</b>",
        f"AICTE Permanent Institute ID: <b>{aicte_id}</b>",
        f"District: {district}, State: {state}",
    ]
    for line in address_lines:
        story.append(Paragraph(line, legal_meta))
    story.append(Spacer(1, 10))

    # 4. Notice Banner Box
    notice_box_data = [
        [Paragraph(f"<b>{doc_title}</b>", title_style)],
        [Paragraph(doc_statute, statute_style)],
    ]
    notice_box = Table(notice_box_data, colWidths=[515])
    notice_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8F5FB") if not is_freeze else colors.HexColor("#FFF5F5")),
        ("BOX", (0, 0), (-1, -1), 1.2, header_color),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(notice_box)
    story.append(Spacer(1, 10))

    # 5. Subject Heading
    subject_text = (
        f"<b>SUBJECT:</b> Regulatory notice regarding systemic compliance defaults, severe SLA breaches, "
        f"and critical risk score deterioration (Credit Rating: <b>{score}/1000</b> · Grade: <b>{grade}</b> · Risk Tier: <b>{risk_tier}</b>) "
        f"in respect of {inst_name} (Permanent ID: {aicte_id})."
    )
    story.append(Paragraph(subject_text, body_bold))
    story.append(Spacer(1, 8))

    # 6. Legal Recitals & Operative Findings
    recital_1 = (
        "<b>1. STATUTORY JURISDICTION:</b> WHEREAS, the All India Council for Technical Education (hereinafter "
        "referred to as the 'Council') is established under the All India Council for Technical Education Act, 1987 "
        "(Act No. 52 of 1987) with the statutory mandate to regulate, plan, formulate, and maintain statutory norms "
        "and standards across technical educational institutions throughout the territory of India."
    )
    story.append(Paragraph(recital_1, body_style))
    story.append(Spacer(1, 6))

    recital_2 = (
        f"<b>2. CENTRAL AUTOMATED SURVEILLANCE FINDINGS:</b> WHEREAS, pursuant to the Council's Central Grievance Monitoring "
        f"System, automated dynamic risk assessment models have evaluated the ongoing institutional performance of "
        f"<b>{inst_name}</b>. The evaluation reveals persistent statutory non-compliance, accumulating a critical credit score of "
        f"<b>{score} points out of 1000 (Grade {grade})</b>, categorizing the institution under <b>{risk_tier}</b>."
    )
    story.append(Paragraph(recital_2, body_style))
    story.append(Spacer(1, 6))

    # 7. Summary / Citations Table
    if citations:
        story.append(Paragraph("<b>3. ITEMISED STATUTORY CITATIONS & GRIEVANCE VIOLATIONS:</b>", body_bold))
        story.append(Spacer(1, 4))
        
        table_rows = [
            [
                Paragraph("Case Ref. ID", table_header),
                Paragraph("Violation Category", table_header),
                Paragraph("Statutory Infraction / Subject", table_header),
                Paragraph("Penalty", table_header),
            ]
        ]
        
        for c in citations[:6]:  # Show up to top 6 infractions
            table_rows.append([
                Paragraph(f"<b>{c.get('case_reference_id', 'N/A')}</b>", table_cell),
                Paragraph(c.get("category", "General"), table_cell),
                Paragraph(c.get("subject", "Unresolved Grievance")[:75] + ("..." if len(c.get("subject", "")) > 75 else ""), table_cell),
                Paragraph(f"-{c.get('points_deducted', 0)} pts", table_cell),
            ])
            
        c_table = Table(table_rows, colWidths=[90, 110, 245, 70])
        c_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), header_color),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ]))
        story.append(c_table)
        story.append(Spacer(1, 8))

    # 8. Operative Sanction Clauses
    if is_freeze:
        clause_order = (
            "<b>4. MANDATORY INTAKE FREEZE DIRECTIVE:</b> In exercise of the powers conferred under Section 10(1)(p) "
            "of the AICTE Act, 1987 read with Regulation 4.3 of the Approval Process Handbook, the Council hereby "
            "DIRECTS that the student intake quota for all approved undergraduate, postgraduate, and diploma programs "
            f"for the forthcoming academic cycle at <b>{inst_name}</b> shall remain <b>STRICTLY FROZEN AT ZERO (0)</b> "
            "pending comprehensive verification and resolution of all outstanding grievances."
        )
    else:
        clause_order = (
            "<b>4. CALL TO SHOW CAUSE:</b> NOW THEREFORE, the Chairman, Members of the Governing Board, and Principal "
            f"of <b>{inst_name}</b> are hereby CALLED UPON to submit a point-by-point, Section 65B certified legal "
            "explanation supported by verifiable documentation within <b>FOURTEEN (14) CALENDAR DAYS</b> of receipt of this notice, "
            "showing cause as to why punitive sanctions under Section 10(1) of the AICTE Act—including withdrawal of approval, "
            "reduction of approved intake, or derecognition—should not be initiated against the institution."
        )
    story.append(Paragraph(clause_order, body_style))
    story.append(Spacer(1, 6))

    if directive_notes:
        directive_clause = f"<b>5. EXECUTIVE TERMS & CONDITIONS:</b> {directive_notes}"
        story.append(Paragraph(directive_clause, body_style))
        story.append(Spacer(1, 6))

    consequence_text = (
        "<b>6. CONSEQUENCE OF DEFAULT:</b> Please take notice that in the event of failure to respond within the stipulated "
        "period of fourteen (14) days, or if the explanation tendered is deemed unsatisfactory by the Council, ex-parte "
        "adverse proceedings will be concluded without further opportunity for hearing."
    )
    story.append(Paragraph(consequence_text, body_style))
    story.append(Spacer(1, 14))

    # 9. Signatory & Official Seal
    signatory_data = [
        [
            Paragraph("<b>PLACE:</b> New Delhi<br/><b>DATE:</b> " + date_str, legal_meta),
            Paragraph(
                "<b>FOR AND ON BEHALF OF<br/>ALL INDIA COUNCIL FOR TECHNICAL EDUCATION</b><br/><br/>"
                "<b>[DIGITALLY SIGNED & SEALED]</b><br/>"
                "Member Secretary / Central Regulatory Authority<br/>"
                "Bureau of Grievance Oversight & Compliance",
                legal_meta_bold,
            ),
        ]
    ]
    sig_table = Table(signatory_data, colWidths=[240, 275])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(KeepTogether([sig_table]))
    story.append(Spacer(1, 10))

    # 10. Copy Forwarded To (C.C.)
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC"), spaceAfter=6))
    cc_text = (
        "<b>COPY FORWARDED FOR URGENT INFORMATION AND NECESSARY REGULATORY ACTION TO:</b><br/>"
        f"1. The Principal Secretary / Secretary (Higher & Technical Education), Government of {state}.<br/>"
        f"2. The Regional Officer, AICTE Regional Camp Office ({state} Jurisdiction).<br/>"
        f"3. The Registrar, Affiliating State Technical University, for withholding enrollment approvals.<br/>"
        f"4. AICTE National Case Register & Legal Cell Archival Repository (Ref: {ref_no})."
    )
    story.append(Paragraph(cc_text, legal_meta))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
