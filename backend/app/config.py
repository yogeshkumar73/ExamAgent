import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "SkillArena AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "skillarena_super_secret_production_key_123456789")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Database & Cache
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "skillarena")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # AI Provider
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    AI_TIMEOUT_SECONDS: int = 25

    # Storage & Upload Limits (Section 17)
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    MAX_QUESTIONS_PER_REQUEST: int = 20

    # Rate Limiting (Requests per minute)
    RATE_LIMIT_PER_MINUTE: int = 60


settings = Settings()
