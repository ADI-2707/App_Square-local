from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user_schema import CreateUserRequest
from app.utils.dependencies import get_db
from app.utils.role_checker import require_role
from app.services.user_service import create_user, list_users, delete_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("")
def create_new_user(
    request: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("root"))
):
    return create_user(
        db=db,
        username=request.username,
        password=request.password,
        role=request.role
    )

@router.get("")
def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("root"))
):
    return list_users(db)



@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("root"))
):
    return delete_user(db, user_id, current_user)