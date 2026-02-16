from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.user_schema import LoginRequest, TokenResponse
from app.models.user import User
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.dependencies import get_current_user, get_db
from app.services.log_service import add_log
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

MAX_ATTEMPTS = 5
BLOCK_DURATION_MINUTES = 5

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()

    actor = None
    if request.username == "admin":
        actor = "A"
    elif request.username == "guest":
        actor = "G"

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if user.blocked_until and datetime.utcnow() < user.blocked_until:
        add_log(
            db=db,
            actor=actor,
            action="LOGIN_BLOCKED",
            status="FAILURE"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to multiple failed login attempts"
        )

    if not verify_password(request.password, user.hashed_password):

        user.failed_attempts += 1

        if user.failed_attempts >= MAX_ATTEMPTS:
            user.blocked_until = datetime.utcnow() + timedelta(minutes=BLOCK_DURATION_MINUTES)
            user.failed_attempts = 0

        db.commit()

        add_log(
            db=db,
            actor=actor,
            action="LOGIN_FAILURE",
            status="FAILURE"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user.failed_attempts = 0
    user.blocked_until = None
    db.commit()

    add_log(
        db=db,
        actor=actor,
        action="LOGIN_SUCCESS",
        status="SUCCESS"
    )

    token = create_access_token({
        "sub": user.username,
        "tv": user.token_version
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }



@router.get("/profile")
def get_profile(current_user = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }