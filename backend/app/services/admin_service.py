from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.utils.security import hash_password
from app.queries import user_queries, log_queries


def change_user_password(
    db: Session,
    request,
    current_user: User
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

    target = user_queries.get_by_username(db, request.target_user)

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user_queries.update_password_and_increment_token(
        db,
        target,
        hash_password(request.new_password)
    )

    return {"message": f"{request.target_user} password updated successfully"}


def get_logs(
    db: Session,
    page: int,
    page_size: int,
    sort_order: str,
    current_user: User
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    if page < 1 or page_size < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pagination parameters"
        )

    total, logs = log_queries.get_logs_paginated(
        db,
        page,
        page_size,
        sort_order
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "logs": [
            {
                "id": log.id,
                "actor": log.actor,
                "action": log.action,
                "status": log.status,
                "endpoint": log.endpoint,
                "method": log.method,
                "error_type": log.error_type,
                "error_message": log.error_message,
                "timestamp": log.timestamp
            }
            for log in logs
        ]
    }