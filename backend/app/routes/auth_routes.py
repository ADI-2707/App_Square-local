from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.user_schema import LoginRequest, TokenResponse
from app.models.user import User
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.dependencies import get_current_user
from app.services.log_service import add_log
from app.utils.rate_limiter import is_blocked, record_failure, reset_attempts

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()

    actor = None
    if request.username == "admin":
        actor = "A"
    elif request.username == "guest":
        actor = "G"

    if request.username in ["admin", "guest"] and is_blocked(request.username):
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

    if not user or not verify_password(request.password, user.hashed_password):

        if request.username in ["admin", "guest"]:
            record_failure(request.username)

        if actor:
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

    reset_attempts(request.username)

    add_log(
        db=db,
        actor=actor,
        action="LOGIN_SUCCESS",
        status="SUCCESS"
    )

    token = create_access_token({"sub": user.username})

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
