from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.schemas.user_schema import PasswordChangeRequest
from app.utils.dependencies import get_current_user, get_db
from app.services.admin_service import get_logs
from app.commands.admin_commands import change_user_password_command

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.put("/change-password")
def change_password(
    request: PasswordChangeRequest,
    request_obj: Request,
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