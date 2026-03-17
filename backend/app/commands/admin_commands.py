from sqlalchemy.orm import Session
from fastapi import HTTPException, Request

from app.models.user import User
from app.utils.security import hash_password, verify_password
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
    
    print("USER:", current_user.username)
    print("HASHED PASSWORD:", current_user.hashed_password)
    print("TYPE:", type(current_user.hashed_password))
    print("INPUT CURRENT PASSWORD:", request.current_password)

    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if verify_password(request.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different")

    if not request.current_password or not request.new_password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    user_queries.update_password_and_increment_token(
        db,
        current_user,
        hash_password(request.new_password)
    )

    return {"message": "Password updated successfully"}