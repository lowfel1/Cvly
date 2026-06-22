"""Service to generate optimized CVs in PDF format."""

import os
import re
from io import BytesIO
from datetime import datetime
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Flowable
)
from reportlab.pdfgen import canvas


# Brand colors matching the app
NAVY = HexColor("#2A3A7A")
TEAL_DARK = HexColor("#05716c")
TEAL_CYAN = HexColor("#1fbfb8")
SKY_BLUE = HexColor("#1978a5")
LIGHT_GRAY = HexColor("#F5F8FB")
BORDER_GRAY = HexColor("#D5DDE8")
TEXT_DARK = HexColor("#1A2A5A")
TEXT_LIGHT = HexColor("#5B6B95")


class HorizontalLine(Flowable):
    """Custom horizontal line flowable."""

    def __init__(self, width, thickness=1, color=BORDER_GRAY):
        Flowable.__init__(self)
        self.width = width
        self.thickness = thickness
        self.color = color

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)


def parse_cv_sections(text: str) -> dict:
    """
    Parse the optimized CV text into structured sections.
    Returns a dict with: name, contact, summary, experience, skills, education, languages.
    """
    sections = {
        "name": "",
        "title": "",
        "contact": [],
        "summary": "",
        "experience": [],
        "skills": [],
        "education": [],
        "languages": [],
        "projects": [],
    }

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return sections

    # First line is usually the name
    sections["name"] = lines[0]

    # Try to detect title/position (line 2)
    if len(lines) > 1 and not _is_contact_info(lines[1]):
        sections["title"] = lines[1]

    # Extract contact info (email, phone, location, linkedin)
    contact_patterns = {
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "phone": r"(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}",
        "linkedin": r"linkedin\.com\/[a-zA-Z0-9-_/]+",
        "github": r"github\.com\/[a-zA-Z0-9-_/]+",
    }

    for line in lines[:10]:
        for key, pattern in contact_patterns.items():
            matches = re.findall(pattern, line, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = "".join(match)
                if match and match not in [c.get("value", "") for c in sections["contact"]]:
                    sections["contact"].append({"type": key, "value": match})

    # Detect sections by keywords
    section_keywords = {
        "summary": ["summary", "profile", "objective", "à propos", "profil", "résumé"],
        "experience": ["experience", "expérience", "work history", "professional experience"],
        "skills": ["skills", "compétences", "technical skills", "technologies"],
        "education": ["education", "formation", "études", "diplômes"],
        "languages": ["languages", "langues"],
        "projects": ["projects", "projets"],
    }

    current_section = None
    section_content = []

    for line in lines:
        line_lower = line.lower()
        matched = False

        # Check if this line is a section header
        for section_name, keywords in section_keywords.items():
            if any(kw in line_lower for kw in keywords) and len(line) < 50:
                # Save previous section
                if current_section and section_content:
                    sections[current_section] = section_content.copy()
                current_section = section_name
                section_content = []
                matched = True
                break

        if not matched and current_section:
            section_content.append(line)

    # Save last section
    if current_section and section_content:
        sections[current_section] = section_content

    # Convert summary list to string
    if isinstance(sections["summary"], list):
        sections["summary"] = " ".join(sections["summary"])

    # Parse skills (often comma-separated or bullet points)
    if isinstance(sections["skills"], list):
        all_skills = []
        for skill_line in sections["skills"]:
            # Split by common separators
            parts = re.split(r"[,•|·;]", skill_line)
            for part in parts:
                clean = part.strip().lstrip("-").strip()
                if clean and len(clean) < 50:
                    all_skills.append(clean)
        sections["skills"] = all_skills

    return sections


def _is_contact_info(line: str) -> bool:
    """Check if a line contains contact information."""
    patterns = [r"@", r"\+\d", r"linkedin", r"github", r"phone", r"email"]
    return any(re.search(p, line, re.IGNORECASE) for p in patterns)


def generate_cv_pdf(
    optimized_text: str,
    user_name: Optional[str] = None,
    output_path: Optional[str] = None
) -> bytes:
    """
    Generate a professional CV PDF from optimized text.

    Args:
        optimized_text: The optimized CV content from Claude AI
        user_name: Optional user full name (fallback)
        output_path: Optional file path, if None returns bytes

    Returns:
        PDF as bytes
    """
    # Parse the CV into structured sections
    cv_data = parse_cv_sections(optimized_text)

    # If no name detected, use fallback
    if not cv_data["name"] and user_name:
        cv_data["name"] = user_name

    # Setup PDF buffer
    buffer = BytesIO()

    # Create document with margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title=f"CV - {cv_data['name']}",
        author=cv_data['name'],
    )

    # Build styles
    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "Name",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=NAVY,
        spaceAfter=4,
        alignment=TA_LEFT,
        leading=28,
    )

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        textColor=TEAL_DARK,
        spaceAfter=8,
        alignment=TA_LEFT,
        leading=14,
    )

    contact_style = ParagraphStyle(
        "Contact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=TEXT_LIGHT,
        spaceAfter=12,
        alignment=TA_LEFT,
        leading=12,
    )

    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=6,
        alignment=TA_LEFT,
        leading=13,
        textTransform="uppercase",
        letterSpacing=1.5,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=TEXT_DARK,
        spaceAfter=4,
        alignment=TA_JUSTIFY,
        leading=14,
    )

    item_style = ParagraphStyle(
        "Item",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        textColor=TEXT_DARK,
        spaceAfter=3,
        alignment=TA_LEFT,
        leading=13,
        leftIndent=12,
        bulletIndent=0,
    )

    # ─────────────────────────────────────────
    # Build the story (content)
    # ─────────────────────────────────────────
    story = []

    # ── HEADER: Name + Title + Contact ──
    if cv_data["name"]:
        story.append(Paragraph(cv_data["name"].upper(), name_style))

    if cv_data["title"]:
        story.append(Paragraph(cv_data["title"], title_style))

    # Contact info on one line
    if cv_data["contact"]:
        contact_parts = []
        icons = {"email": "✉", "phone": "☎", "linkedin": "in", "github": "GH"}
        for c in cv_data["contact"]:
            icon = icons.get(c["type"], "•")
            contact_parts.append(f"{c['value']}")
        contact_text = "  ·  ".join(contact_parts)
        story.append(Paragraph(contact_text, contact_style))

    # Decorative line under header
    story.append(HorizontalLine(17 * cm, thickness=1.5, color=TEAL_CYAN))
    story.append(Spacer(1, 8))

    # ── SUMMARY / PROFILE ──
    if cv_data["summary"]:
        story.append(Paragraph("PROFILE", section_title_style))
        story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
        story.append(Spacer(1, 4))
        story.append(Paragraph(cv_data["summary"], body_style))

    # ── EXPERIENCE ──
    if cv_data["experience"]:
        story.append(Paragraph("EXPERIENCE", section_title_style))
        story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
        story.append(Spacer(1, 4))
        for item in cv_data["experience"]:
            if item.strip().startswith(("-", "•", "*")):
                clean = item.strip().lstrip("-•* ").strip()
                story.append(Paragraph(f"• {clean}", item_style))
            else:
                story.append(Paragraph(item, body_style))

    # ── EDUCATION ──
    if cv_data["education"]:
        story.append(Paragraph("EDUCATION", section_title_style))
        story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
        story.append(Spacer(1, 4))
        for item in cv_data["education"]:
            if item.strip().startswith(("-", "•", "*")):
                clean = item.strip().lstrip("-•* ").strip()
                story.append(Paragraph(f"• {clean}", item_style))
            else:
                story.append(Paragraph(item, body_style))

    # ── SKILLS ──
    if cv_data["skills"]:
        story.append(Paragraph("SKILLS", section_title_style))
        story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
        story.append(Spacer(1, 4))

        # Display skills as a grid (pill-style)
        skills_text = "  ·  ".join(cv_data["skills"][:20])
        skill_style = ParagraphStyle(
            "Skill", parent=body_style, fontSize=9.5,
            textColor=TEAL_DARK, leading=15
        )
        story.append(Paragraph(skills_text, skill_style))

    # ── PROJECTS ──
    if cv_data["projects"]:
        story.append(Paragraph("PROJECTS", section_title_style))
        story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
        story.append(Spacer(1, 4))
        for item in cv_data["projects"]:
            if item.strip().startswith(("-", "•", "*")):
                clean = item.strip().lstrip("-•* ").strip()
                story.append(Paragraph(f"• {clean}", item_style))
            else:
                story.append(Paragraph(item, body_style))

    # ── LANGUAGES ──
    if cv_data["languages"]:
        story.append(Paragraph("LANGUAGES", section_title_style))
        story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
        story.append(Spacer(1, 4))
        lang_text = "  ·  ".join(
            [l.strip().lstrip("-•* ").strip() for l in cv_data["languages"]]
        )
        story.append(Paragraph(lang_text, body_style))

    # Footer with branding
    story.append(Spacer(1, 20))
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontName="Helvetica-Oblique", fontSize=7,
        textColor=TEXT_LIGHT, alignment=TA_CENTER
    )
    story.append(HorizontalLine(17 * cm, thickness=0.5, color=BORDER_GRAY))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"Optimized with Cvly · Generated on {datetime.now().strftime('%B %d, %Y')}",
        footer_style
    ))

    # Build the PDF
    doc.build(story)

    pdf_bytes = buffer.getvalue()
    buffer.close()

    # If output path specified, save to file
    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)

    return pdf_bytes