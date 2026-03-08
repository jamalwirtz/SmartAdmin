"""
SSTG – FastAPI Application Factory
Run:    uvicorn main:app --reload        (from backend/)
        python app.py                    (convenience shim)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import Base, engine
import models  # noqa: registers all ORM models

import auth, teachers, subjects, classes, schedules, exports
import ws_routes as websockets

settings = get_settings()

# Create all tables on startup (safe to call repeatedly — skips existing tables)
Base.metadata.create_all(bind=engine)

# ── Auto-seed admin user if DB is empty ──────────────────────────────────────
def _ensure_admin():
    """Create default admin account on first boot if none exists."""
    from database import SessionLocal
    from models import User
    from security import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).first():
            admin = User(
                username="admin",
                email="admin@school.demo",
                hashed_password=hash_password("admin123"),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()

_ensure_admin()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Automated school timetable generator — constraint-based scheduling, "
        "multi-draft generation, static slot locking, drag-and-drop editing, "
        "real-time WebSocket updates, PDF export & email delivery."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# IMPORTANT: allow_credentials=True is ILLEGAL when allow_origins=["*"].
# Starlette raises a ValueError and ALL requests are blocked.
# Rule: wildcard origin → no credentials. Specific origins → credentials OK.
_origins = settings.cors_origins_list
_wildcard = _origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=not _wildcard,   # False when *, True when specific origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/auth",     tags=["Authentication"])
app.include_router(teachers.router,   prefix="/teachers", tags=["Teachers"])
app.include_router(subjects.router,   prefix="/subjects", tags=["Subjects"])
app.include_router(classes.router,    prefix="/classes",  tags=["Classes"])
app.include_router(schedules.router,  prefix="/schedule", tags=["Schedule"])
app.include_router(exports.router,    prefix="/export",   tags=["Export & Email"])
app.include_router(websockets.router, tags=["WebSockets"])


@app.api_route("/", methods=["GET", "HEAD"], tags=["Health"])
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}


@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"])
def health():
    return {"status": "ok"}
