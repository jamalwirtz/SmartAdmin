"""
SSTG – FastAPI Application Factory
Run: uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
import app.models  # noqa: registers all ORM models

from app.api import auth, teachers, subjects, classes, schedules, exports, websockets

settings = get_settings()

Base.metadata.create_all(bind=engine)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",     tags=["Authentication"])
app.include_router(teachers.router,    prefix="/teachers", tags=["Teachers"])
app.include_router(subjects.router,    prefix="/subjects", tags=["Subjects"])
app.include_router(classes.router,     prefix="/classes",  tags=["Classes"])
app.include_router(schedules.router,   prefix="/schedule", tags=["Schedule"])
app.include_router(exports.router,     prefix="/export",   tags=["Export & Email"])
app.include_router(websockets.router,  tags=["WebSockets"])


@app.get("/", tags=["Health"])
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
