"""SSTG – PDF Export Service using ReportLab."""
from collections import defaultdict
from io import BytesIO
from typing import Dict

from fastapi import HTTPException
from sqlalchemy.orm import Session

from config import get_settings
from models import ClassSection, Subject, Teacher, TimetableDraft, TimetableSlot

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    RL = True
except ImportError:
    RL = False

cfg = get_settings()


class PDFExporter:

    def _check(self):
        if not RL:
            raise HTTPException(503, "reportlab not installed. Run: pip install reportlab")

    def _header(self, story, title: str):
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("T", parent=styles["Title"], fontSize=18,
                                      textColor=colors.HexColor("#1a237e"), spaceAfter=4)
        sub_style = ParagraphStyle("S", parent=styles["Normal"], fontSize=9,
                                    textColor=colors.grey, spaceAfter=10)
        story.append(Paragraph(cfg.SCHOOL_NAME, title_style))
        story.append(Paragraph(f"{title}  |  Academic Year: {cfg.ACADEMIC_YEAR}", sub_style))
        story.append(Spacer(1, 0.3 * cm))

    def full_draft_pdf(self, draft: TimetableDraft, db: Session) -> bytes:
        self._check()
        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                                 leftMargin=1*cm, rightMargin=1*cm,
                                 topMargin=1.5*cm, bottomMargin=1.5*cm)
        story = []
        self._header(story, draft.name)

        days = cfg.school_days_list
        periods = list(range(1, cfg.PERIODS_PER_DAY + 1))
        slots = db.query(TimetableSlot).filter(TimetableSlot.draft_id == draft.id).all()
        subj_map: Dict[str, Subject] = {s.id: s for s in db.query(Subject).all()}
        tchr_map: Dict[str, Teacher] = {t.id: t for t in db.query(Teacher).all()}
        cls_map: Dict[str, ClassSection] = {c.id: c for c in db.query(ClassSection).all()}

        slot_idx: Dict[str, Dict] = defaultdict(dict)
        for s in slots:
            slot_idx[s.class_id][(s.day, s.period)] = s

        for cls in db.query(ClassSection).all():
            styles = getSampleStyleSheet()
            story.append(Paragraph(f"Class: {cls.name}  (Grade {cls.grade_level})", styles["Heading2"]))
            story.append(Spacer(1, 0.15*cm))

            header = ["Period"] + days
            rows = [header]
            for p in periods:
                row = [str(p)]
                for d in days:
                    s = slot_idx[cls.id].get((d, p))
                    if s and s.subject_id:
                        subj = subj_map.get(s.subject_id)
                        tchr = tchr_map.get(s.teacher_id) if s.teacher_id else None
                        cell = f"{'[L] ' if s.is_locked else ''}{subj.name if subj else '?'}\n{tchr.name if tchr else ''}"
                    else:
                        cell = ""
                    row.append(cell)
                rows.append(row)

            col_w = [1.5*cm] + [3.2*cm] * len(days)
            tbl = Table(rows, colWidths=col_w, repeatRows=1)
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#283593")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9fa8da")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#e8eaf6")]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(tbl)
            story.append(Spacer(1, 0.8*cm))

        doc.build(story)
        return buf.getvalue()

    def teacher_pdf(self, teacher: Teacher, draft: TimetableDraft, db: Session) -> bytes:
        self._check()
        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                 leftMargin=2*cm, rightMargin=2*cm,
                                 topMargin=2*cm, bottomMargin=2*cm)
        story = []
        self._header(story, f"Weekly Schedule — {teacher.name}")

        days = cfg.school_days_list
        periods = list(range(1, cfg.PERIODS_PER_DAY + 1))
        slots = (
            db.query(TimetableSlot)
            .filter(TimetableSlot.draft_id == draft.id, TimetableSlot.teacher_id == teacher.id)
            .all()
        )
        subj_map = {s.id: s for s in db.query(Subject).all()}
        cls_map = {c.id: c for c in db.query(ClassSection).all()}
        slot_idx = {(s.day, s.period): s for s in slots}

        header = ["Period"] + days
        rows = [header]
        total = 0
        for p in periods:
            row = [str(p)]
            for d in days:
                s = slot_idx.get((d, p))
                if s and s.subject_id:
                    subj = subj_map.get(s.subject_id)
                    cls = cls_map.get(s.class_id)
                    row.append(f"{subj.name if subj else '?'}\n{cls.name if cls else ''}")
                    total += 1
                else:
                    row.append("")
            rows.append(row)

        col_w = [1.5*cm] + [3*cm] * len(days)
        tbl = Table(rows, colWidths=col_w, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#004d40")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#80cbc4")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#e0f2f1")]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 0.5*cm))
        styles = getSampleStyleSheet()
        story.append(Paragraph(
            f"Total periods assigned: {total}  /  Max: {teacher.max_weekly_hours}  |  "
            f"Remaining capacity: {teacher.max_weekly_hours - total}",
            styles["Normal"],
        ))
        doc.build(story)
        return buf.getvalue()
