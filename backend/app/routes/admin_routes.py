from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user_schema import PasswordChangeRequest
from app.utils.dependencies import get_current_user, get_db
from app.services.admin_service import (
    change_user_password,
    get_logs
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.put("/change-password")
def change_password(
    request: PasswordChangeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = change_user_password(
            db,
            request,
            current_user
        )
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise


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