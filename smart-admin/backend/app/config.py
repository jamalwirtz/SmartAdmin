"""SSTG – Application Configuration"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Smart School Timetable Generator"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-run-openssl-rand-hex-32"

    DATABASE_URL: str = "sqlite:///./sstg.db"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "SSTG System"

    SCHOOL_NAME: str = "Greenfield Academy"
    ACADEMIC_YEAR: str = "2024/2025"
    PERIODS_PER_DAY: int = 8
    SCHOOL_DAYS: str = "Monday,Tuesday,Wednesday,Thursday,Friday"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def school_days_list(self) -> List[str]:
        return [d.strip() for d in self.SCHOOL_DAYS.split(",")]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
