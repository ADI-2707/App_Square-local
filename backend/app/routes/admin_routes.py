from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.user_schema import PasswordChangeRequest
from app.utils.dependencies import get_current_user
from app.utils.security import hash_password
from app.services.log_service import add_log


router = APIRouter(prefix="/admin", tags=["Admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.put("/change-password")
def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    if request.target_user not in ["admin", "guest"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target user"
        )

    target = db.query(User).filter(User.username == request.target_user).first()

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    target.hashed_password = hash_password(request.new_password)
    db.commit()

    add_log(
        db=db,
        actor="A",
        action="PASSWORD_CHANGE",
        status="SUCCESS"
    )

    return {"message": f"{request.target_user} password updated successfully"}
