from fastapi import APIRouter, Depends, Request, Body
from sqlalchemy.orm import Session

from app.schemas.user_schema import PasswordChangeRequest
from app.utils.dependencies import get_current_user, get_db
from app.services.admin_service import (
    get_logs,
    get_all_operators,
    toggle_operator_status,
    admin_change_operator_password
)
from app.commands.admin_commands import change_user_password_command

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.put("/change-password")
def change_password(
    request_obj: Request,
    request: PasswordChangeRequest = Body(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return change_user_password_command(
        db=db,
        request=request,
        current_user=current_user,
        request_obj=request_obj
    )


@router.get("/logs")
def view_logs(
    page: int = 1,
    page_size: int = 10,
    sort_order: str = "desc",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_logs(
        db,
        page,
        page_size,
        sort_order,
        current_user
    )


@router.get("/operators")
def get_operators(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_all_operators(db, current_user)


@router.patch("/operators/{user_id}/toggle")
def toggle_operator(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return toggle_operator_status(db, user_id, current_user)


@router.put("/operators/{user_id}/password")
def change_operator_password(
    user_id: int,
    new_password: str = Body(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return admin_change_operator_password(
        db,
        user_id,
        new_password,
        current_user
    )