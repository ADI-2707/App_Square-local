import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

DATABASE_URL = os.getenv("DATABASE_URL")

ROOT_ADMIN_USERNAME = os.getenv("ROOT_ADMIN_USERNAME")
ROOT_ADMIN_PASSWORD = os.getenv("ROOT_ADMIN_PASSWORD")