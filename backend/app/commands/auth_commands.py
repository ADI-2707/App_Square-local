from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException, Request

from app.schemas.user_schema import LoginRequest
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from app.core.transaction import transactional
from app.core.command_logger import command_logger
from app.queries import user_queries
from app.models.user import User

MAX_ATTEMPTS = 5
BLOCK_DURATION_MINUTES = 5


@transactional
@command_logger(action="LOGIN")
def login_command(
    db: Session,
    request_data: LoginRequest,
    request: Request = None
):
    user = user_queries.get_by_username(db, request_data.username)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.blocked_until and datetime.utcnow() < user.blocked_until:
        raise HTTPException(
            status_code=429,
            detail="Account temporarily locked due to multiple failed login attempts"
        )

    if not verify_password(request_data.password, user.hashed_password):

        user_queries.increment_failed_attempts(
            db=db,
            user=user,
            max_attempts=MAX_ATTEMPTS,
            block_duration_minutes=BLOCK_DURATION_MINUTES
        )

        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_queries.reset_login_state(db, user)

    token = create_access_token({
        "sub": user.username,
        "tv": user.token_version
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@transactional
@command_logger(action="LOGOUT")
def logout_command(
    db: Session,
    current_user: User,
    request: Request = None
):
    current_user.token_version += 1
    return {"message": "Logged out successfully"}