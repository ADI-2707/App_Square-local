import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(ENV_PATH)


def _resolve_sqlite_url(database_url: str | None) -> str | None:
    if not database_url or not database_url.startswith("sqlite:///"):
        return database_url

    sqlite_path = database_url.removeprefix("sqlite:///")

    if not sqlite_path or Path(sqlite_path).is_absolute():
        return database_url

    resolved_path = (BACKEND_DIR / sqlite_path).resolve()
    return f"sqlite:///{resolved_path.as_posix()}"

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

DATABASE_URL = _resolve_sqlite_url(os.getenv("DATABASE_URL"))

ROOT_ADMIN_USERNAME = os.getenv("ROOT_ADMIN_USERNAME")
ROOT_ADMIN_PASSWORD = os.getenv("ROOT_ADMIN_PASSWORD")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")

TAG_SOURCE_KIND = os.getenv("TAG_SOURCE_KIND", "excel")
TAG_SOURCE_EXCEL_PATH = os.getenv("TAG_SOURCE_EXCEL_PATH", "")
TAG_SOURCE_EXCEL_SHEET = os.getenv("TAG_SOURCE_EXCEL_SHEET", "")
TAG_SOURCE_LOOKUP_COLUMN = os.getenv("TAG_SOURCE_LOOKUP_COLUMN", "A")
TAG_SOURCE_VALUE_COLUMN = os.getenv("TAG_SOURCE_VALUE_COLUMN", "B")

LOG_RETENTION_DAYS = int(os.getenv("LOG_RETENTION_DAYS", "90"))
LOG_CLEANUP_INTERVAL_MINUTES = int(os.getenv("LOG_CLEANUP_INTERVAL_MINUTES", "60"))

required_settings = [
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    DATABASE_URL,
    ROOT_ADMIN_USERNAME,
    ROOT_ADMIN_PASSWORD,
]

if not all(required_settings):
    raise ValueError("One or more required environment variables are missing.")
