import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_meeting_pdf(meeting: Dict[str, Any], briefing: Dict[str, Any], claims: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> bytes:
    """Generates an executive-grade PDF briefing report using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    claim_box_fresh = ParagraphStyle(
        'ClaimFresh',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#166534')
    )
    claim_box_stale = ParagraphStyle(
        'ClaimStale',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#991B1B')
    )

    story = []

    # Title & Header
    target = meeting.get("target_name", "Target Organization")
    m_type = meeting.get("meeting_type", "Executive Briefing")
    m_date = meeting.get("meeting_date", "")
    m_time = meeting.get("meeting_time", "")

    story.append(Paragraph(f"VERITYMEET AI · {target.upper()}", title_style))
    story.append(Paragraph(f"<b>Meeting Type:</b> {m_type} &nbsp;|&nbsp; <b>Date & Time:</b> {m_date} at {m_time} &nbsp;|&nbsp; <b>Verification Engine:</b> LangGraph + Tavily", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=12))

    # Executive Summary
    story.append(Paragraph("EXECUTIVE SUMMARY", h2_style))
    exec_summary = briefing.get("executive_summary", "No executive summary available.")
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 6))

    # Why It Matters
    if briefing.get("why_it_matters"):
        story.append(Paragraph("STRATEGIC CONTEXT & WHY THIS MATTERS", h2_style))
        story.append(Paragraph(briefing.get("why_it_matters"), body_style))
        story.append(Spacer(1, 6))

    # Recent Developments
    recent_devs = briefing.get("recent_developments", [])
    if recent_devs:
        story.append(Paragraph("RECENT DEVELOPMENTS (30-DAY WINDOW)", h2_style))
        for dev in recent_devs[:5]:
            title = dev.get("title", "Development")
            date_str = dev.get("date", "")
            summary = dev.get("summary", "")
            story.append(Paragraph(f"<b>• {title}</b> ({date_str}): {summary}", body_style))
        story.append(Spacer(1, 6))

    # Leadership & Key People
    leadership = briefing.get("leadership_updates", [])
    if leadership:
        story.append(Paragraph("LEADERSHIP & KEY PEOPLE", h2_style))
        for person in leadership[:4]:
            name = person.get("name", "")
            role = person.get("role", "")
            bg = person.get("background", "")
            story.append(Paragraph(f"<b>• {name}</b> - <i>{role}</i>: {bg}", body_style))
        story.append(Spacer(1, 6))

    # Stale Claim Corrections & Audit
    corrections = briefing.get("corrections", [])
    if corrections:
        story.append(Paragraph("STALE CLAIM DETECTIONS & VERIFIED CORRECTIONS", h2_style))
        for cor in corrections:
            orig = cor.get("original_claim", "")
            corrected = cor.get("corrected_claim", "")
            reason = cor.get("reason", "")
            cor_text = f"<b>[STALE DETECTED]</b> Outdated: \"{orig}\"<br/><b>[VERIFIED CORRECTION]</b> {corrected}<br/><i>Evidence: {reason}</i>"
            story.append(Paragraph(cor_text, claim_box_stale))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 6))

    # Verification Overview & Claim Audit Table
    if claims:
        story.append(Paragraph("FACTUAL FRESHNESS AUDIT", h2_style))
        table_data = [["Claim / Factual Statement", "Category", "Freshness Score", "Status"]]
        for c in claims[:8]:
            score_txt = f"{c.get('freshness_score', 0):.0f}/100" if c.get("time_sensitive") else "Stable"
            table_data.append([
                Paragraph(c.get("claim_text", "")[:95] + ("..." if len(c.get("claim_text", "")) > 95 else ""), body_style),
                Paragraph(c.get("category", "General"), body_style),
                Paragraph(score_txt, body_style),
                Paragraph(f"<b>{c.get('status', 'FRESH')}</b>", claim_box_fresh if c.get("status") == "FRESH" else claim_box_stale)
            ])

        t = Table(table_data, colWidths=[280, 80, 80, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    # Open Strategic Questions
    questions = briefing.get("open_questions", [])
    if questions:
        story.append(Paragraph("RECOMMENDED STRATEGIC DISCUSSION QUESTIONS", h2_style))
        for q in questions[:5]:
            story.append(Paragraph(f"• {q}", body_style))
        story.append(Spacer(1, 6))

    # Sources
    if sources:
        story.append(Paragraph("SOURCE ATTRIBUTION & PROVENANCE", h2_style))
        for s in sources[:6]:
            s_title = s.get("title", "Source")
            s_url = s.get("url", "")
            s_domain = s.get("domain", "")
            story.append(Paragraph(f"• <b>[{s.get('id')}]</b> {s_title} ({s_domain}) - {s_url}", body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
