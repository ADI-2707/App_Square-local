import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

DATABASE_URL = os.getenv("DATABASE_URL")

ROOT_ADMIN_USERNAME = os.getenv("ROOT_ADMIN_USERNAME")
ROOT_ADMIN_PASSWORD = os.getenv("ROOT_ADMIN_PASSWORD")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")

TAG_SOURCE_KIND = os.getenv("TAG_SOURCE_KIND", "excel")
TAG_SOURCE_EXCEL_PATH = os.getenv("TAG_SOURCE_EXCEL_PATH", "")
TAG_SOURCE_EXCEL_SHEET = os.getenv("TAG_SOURCE_EXCEL_SHEET", "")
TAG_SOURCE_LOOKUP_COLUMN = os.getenv("TAG_SOURCE_LOOKUP_COLUMN", "A")
TAG_SOURCE_VALUE_COLUMN = os.getenv("TAG_SOURCE_VALUE_COLUMN", "B")

required_settings = [
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    DATABASE_URL,
    ROOT_ADMIN_PASSWORD,
    ROOT_ADMIN_PASSWORD
]

if not all(required_settings):
    raise ValueError("One or more required environment variables are missing.")
