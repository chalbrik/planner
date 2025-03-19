from pydantic import BaseSettings, PostgresDsn, validator
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenvnvm install-latest-npm

load_dotenv()  # ładuje zmienne środowiskowe z pliku .env


class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    APP_NAME: str = "Backend API"
    DEBUG: bool = False
    VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4200", "http://localhost:80"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()