from sqlalchemy.orm import Session
from fastapi import HTTPException, Request

from app.models.user import User
from app.utils.security import hash_password
from app.core.transaction import transactional
from app.core.command_logger import command_logger
from app.queries import user_queries


@transactional
@command_logger(action="PASSWORD_CHANGE")
def change_user_password_command(
    db: Session,
    request,
    current_user: User,
    request_obj: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if request.target_user not in ["admin", "guest"]:
        raise HTTPException(status_code=400, detail="Invalid target user")

    target = user_queries.get_by_username(db, request.target_user)

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    user_queries.update_password_and_increment_token(
        db,
        target,
        hash_password(request.new_password)
    )

    return {"message": f"{request.target_user} password updated successfully"}