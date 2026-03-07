"""
SSTG – ORM Models (all tables).

Python 3.14 compatibility note:
  datetime.utcnow() is deprecated since Python 3.12 and emits DeprecationWarning.
  All timestamps now use `datetime.now(timezone.utc)` (timezone-aware UTC).
  SQLAlchemy's `func.now()` is used for server-side timestamps in production.
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    """Timezone-aware UTC now — replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id              = Column(String(36),  primary_key=True, default=_uuid)
    username        = Column(String(80),  unique=True, nullable=False)
    email           = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    is_admin        = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), default=_now)


class Teacher(Base):
    __tablename__ = "teachers"
    id               = Column(String(36),  primary_key=True, default=_uuid)
    name             = Column(String(120), nullable=False)
    email            = Column(String(120), unique=True, nullable=True)
    is_part_time     = Column(Boolean, default=False)
    max_weekly_hours = Column(Integer, default=30)
    days_off         = Column(String(200), nullable=True)   # "Monday,Friday"
    unavailable_slots= Column(Text, nullable=True)          # JSON: {"Monday":[1,2]}
    created_at       = Column(DateTime(timezone=True), default=_now)

    subjects        = relationship("TeacherSubject", back_populates="teacher", cascade="all, delete-orphan")
    timetable_slots = relationship("TimetableSlot", back_populates="teacher")

    @property
    def days_off_list(self) -> List[str]:
        return [d.strip() for d in self.days_off.split(",")] if self.days_off else []

    @property
    def unavailable_dict(self) -> Dict[str, List[int]]:
        try:
            return json.loads(self.unavailable_slots) if self.unavailable_slots else {}
        except Exception:
            return {}


class Subject(Base):
    __tablename__ = "subjects"
    id                  = Column(String(36), primary_key=True, default=_uuid)
    name                = Column(String(120), nullable=False)
    grade_level         = Column(String(20),  nullable=False)
    weekly_periods      = Column(Integer, default=4)
    allows_double_period= Column(Boolean, default=False)
    is_static_eligible  = Column(Boolean, default=False)
    color_hex           = Column(String(7),   nullable=True)
    created_at          = Column(DateTime(timezone=True), default=_now)

    teacher_assignments = relationship("TeacherSubject", back_populates="subject")
    timetable_slots     = relationship("TimetableSlot",  back_populates="subject")


class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    __table_args__ = (UniqueConstraint("teacher_id", "subject_id"),)
    id         = Column(String(36), primary_key=True, default=_uuid)
    teacher_id = Column(String(36), ForeignKey("teachers.id", ondelete="CASCADE"))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"))
    teacher    = relationship("Teacher", back_populates="subjects")
    subject    = relationship("Subject", back_populates="teacher_assignments")


class ClassSection(Base):
    __tablename__ = "class_sections"
    id                  = Column(String(36), primary_key=True, default=_uuid)
    name                = Column(String(40),  nullable=False)
    grade_level         = Column(String(20),  nullable=False)
    max_subjects_per_day= Column(Integer, default=8)
    created_at          = Column(DateTime(timezone=True), default=_now)

    timetable_slots = relationship("TimetableSlot", back_populates="class_section")


class TimetableDraft(Base):
    __tablename__ = "timetable_drafts"
    id         = Column(String(36), primary_key=True, default=_uuid)
    name       = Column(String(80),  nullable=False)
    seed       = Column(Integer, default=0)
    status     = Column(String(20),  default="draft")   # draft | active | archived
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    slots = relationship("TimetableSlot", back_populates="draft", cascade="all, delete-orphan")


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    __table_args__ = (
        UniqueConstraint("draft_id", "class_id", "day", "period", name="uq_class_slot"),
    )
    id         = Column(String(36), primary_key=True, default=_uuid)
    draft_id   = Column(String(36), ForeignKey("timetable_drafts.id",  ondelete="CASCADE"))
    class_id   = Column(String(36), ForeignKey("class_sections.id",    ondelete="CASCADE"))
    teacher_id = Column(String(36), ForeignKey("teachers.id",          ondelete="SET NULL"), nullable=True)
    subject_id = Column(String(36), ForeignKey("subjects.id",          ondelete="SET NULL"), nullable=True)
    day        = Column(String(12), nullable=False)
    period     = Column(Integer,    nullable=False)
    is_locked  = Column(Boolean, default=False)
    is_break   = Column(Boolean, default=False)
    notes      = Column(String(200), nullable=True)

    draft         = relationship("TimetableDraft",  back_populates="slots")
    class_section = relationship("ClassSection",    back_populates="timetable_slots")
    teacher       = relationship("Teacher",         back_populates="timetable_slots")
    subject       = relationship("Subject",         back_populates="timetable_slots")
