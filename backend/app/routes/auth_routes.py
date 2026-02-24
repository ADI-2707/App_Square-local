from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.schemas.user_schema import LoginRequest, TokenResponse
from app.utils.dependencies import get_current_user, get_db
from app.commands.auth_commands import login_command

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    request_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    return login_command(
        db=db,
        request_data=request_data,
        request=request
    )


@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }