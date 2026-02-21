from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.schemas.user_schema import LoginRequest, TokenResponse
from app.models.user import User
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.dependencies import get_current_user, get_db
from app.services.log_service import add_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

MAX_ATTEMPTS = 5
BLOCK_DURATION_MINUTES = 5


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    endpoint = "/auth/login"
    method = "POST"

    user = db.query(User).filter(User.username == request.username).first()

    try:
        if not user:
            add_log(
                db=db,
                user=None,
                action="LOGIN_FAILURE",
                status="FAILURE",
                endpoint=endpoint,
                method=method,
                error_type="INVALID_USERNAME",
                error_message="Invalid credentials"
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        if user.blocked_until and datetime.utcnow() < user.blocked_until:
            add_log(
                db=db,
                user=user,
                action="LOGIN_BLOCKED",
                status="FAILURE",
                endpoint=endpoint,
                method=method,
                error_type="ACCOUNT_BLOCKED",
                error_message="Account temporarily locked"
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account temporarily locked due to multiple failed login attempts"
            )

        if not verify_password(request.password, user.hashed_password):

            user.failed_attempts += 1

            if user.failed_attempts >= MAX_ATTEMPTS:
                user.blocked_until = datetime.utcnow() + timedelta(
                    minutes=BLOCK_DURATION_MINUTES
                )
                user.failed_attempts = 0

            db.commit()

            add_log(
                db=db,
                user=user,
                action="LOGIN_FAILURE",
                status="FAILURE",
                endpoint=endpoint,
                method=method,
                error_type="INVALID_PASSWORD",
                error_message="Invalid credentials"
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
            user=user,
            action="LOGIN_SUCCESS",
            status="SUCCESS",
            endpoint=endpoint,
            method=method
        )

        token = create_access_token({
            "sub": user.username,
            "tv": user.token_version
        })

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        add_log(
            db=db,
            user=user if user else None,
            action="LOGIN_FAILURE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type="INTERNAL_ERROR",
            error_message=str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )


@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }