from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.schemas.user_schema import LoginRequest, TokenResponse
from app.models.user import User
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.dependencies import get_current_user, get_db
from app.services.log_service import add_log
from app.services.auth_service import login_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

MAX_ATTEMPTS = 5
BLOCK_DURATION_MINUTES = 5


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    result = login_user(request, db)
    db.commit()
    return result


@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }