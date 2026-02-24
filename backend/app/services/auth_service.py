from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException, status

from app.schemas.user_schema import LoginRequest
from app.utils.security import verify_password, hash_password
from app.utils.jwt_handler import create_access_token
from app.services.log_service import add_log
from app.queries import user_queries
from app.config import ROOT_ADMIN_PASSWORD, GUEST_PASSWORD

MAX_ATTEMPTS = 5
BLOCK_DURATION_MINUTES = 5

def login_user(request: LoginRequest, db: Session):

    endpoint = "/auth/login"
    method = "POST"

    try:
        user = user_queries.get_by_username(db, request.username)

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

            user_queries.increment_failed_attempts(
                db=db,
                user=user,
                max_attempts=MAX_ATTEMPTS,
                block_duration_minutes=BLOCK_DURATION_MINUTES
            )

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

        user_queries.reset_login_state(db, user)

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
        try:
            add_log(
                db=db,
                user=None,
                action="LOGIN_FAILURE",
                status="FAILURE",
                endpoint=endpoint,
                method=method,
                error_type="INTERNAL_ERROR",
                error_message=str(e)
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )


def initialize_system_users(db: Session):

    if not ROOT_ADMIN_PASSWORD or not GUEST_PASSWORD:
        raise ValueError("System user passwords must be set in environment variables.")

    try:
        admin = user_queries.get_by_username(db, "admin")
        guest = user_queries.get_by_username(db, "guest")

        if not admin:
            user_queries.create_user(
                db=db,
                username="admin",
                hashed_password=hash_password(ROOT_ADMIN_PASSWORD),
                role="admin"
            )
        else:
            user_queries.update_role(db, admin, "admin")

        if not guest:
            user_queries.create_user(
                db=db,
                username="guest",
                hashed_password=hash_password(GUEST_PASSWORD),
                role="guest"
            )

        db.commit()

    except Exception:
        db.rollback()
        raise