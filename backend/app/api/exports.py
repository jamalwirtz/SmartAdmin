"""SSTG – Export (PDF) and Email routes."""
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Teacher, TimetableDraft
from app.schemas.all import EmailScheduleRequest
from app.services.exporter import PDFExporter
from app.services.email_service import EmailService
from app.core.security import get_current_user, require_admin

router = APIRouter()
exporter = PDFExporter()
mailer = EmailService()


@router.get("/draft/{draft_id}/pdf")
def export_draft_pdf(draft_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    draft = db.get(TimetableDraft, draft_id)
    if not draft:
        raise HTTPException(404, "Draft not found")
    pdf = exporter.full_draft_pdf(draft, db)
    safe_name = draft.name.replace(" ", "_").replace("/", "-")
    return StreamingResponse(
        BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="timetable_{safe_name}.pdf"'},
    )


@router.get("/teacher/{teacher_id}/pdf")
def export_teacher_pdf(teacher_id: str, draft_id: str,
                       db: Session = Depends(get_db), _=Depends(get_current_user)):
    teacher = db.get(Teacher, teacher_id)
    draft = db.get(TimetableDraft, draft_id)
    if not teacher or not draft:
        raise HTTPException(404, "Teacher or draft not found")
    pdf = exporter.teacher_pdf(teacher, draft, db)
    safe_name = teacher.name.replace(" ", "_")
    return StreamingResponse(
        BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="schedule_{safe_name}.pdf"'},
    )


@router.post("/email/teacher")
def email_teacher(req: EmailScheduleRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    teacher = db.get(Teacher, req.teacher_id)
    draft = db.get(TimetableDraft, req.draft_id)
    if not teacher or not draft:
        raise HTTPException(404, "Teacher or draft not found")
    if not teacher.email:
        raise HTTPException(422, "Teacher has no email address on record")
    pdf = exporter.teacher_pdf(teacher, draft, db)
    mailer.send_teacher_schedule(
        teacher_email=teacher.email,
        teacher_name=teacher.name,
        pdf_bytes=pdf,
        custom_message=req.custom_message or "",
    )
    return {"message": f"Schedule emailed to {teacher.email}"}
