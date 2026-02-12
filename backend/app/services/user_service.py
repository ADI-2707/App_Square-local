from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.utils.security import hash_password

VALID_ROLES = ["admin", "user"]

def create_user(db: Session, username: str, password: str, role: str):
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    new_user = User(
        username=username,
        hashed_password=hash_password(password),
        role=role
    )

    db.add(new_user)
    db.commit()

    return {"message": "User created successfully"}


def list_users(db: Session):
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
        for user in users
    ]


def delete_user(db: Session, user_id: int, current_user: User):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.role == "root":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete root user"
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete yourself"
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}