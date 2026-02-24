from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user_schema import LoginRequest, TokenResponse
from app.utils.dependencies import get_current_user, get_db
from app.services.auth_service import login_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        result = login_user(request, db)
        db.commit()
        return result

    except Exception:
        db.rollback()
        raise


@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }