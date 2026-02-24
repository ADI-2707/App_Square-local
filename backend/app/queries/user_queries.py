from sqlalchemy.orm import Session
from datetime import datetime
from app.models.user import User


def get_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def increment_failed_attempts(
    db: Session,
    user: User,
    max_attempts: int,
    block_duration_minutes: int
):
    user.failed_attempts += 1

    if user.failed_attempts >= max_attempts:
        from datetime import timedelta
        user.blocked_until = datetime.utcnow() + timedelta(
            minutes=block_duration_minutes
        )
        user.failed_attempts = 0

    db.add(user)


def reset_login_state(db: Session, user: User):
    user.failed_attempts = 0
    user.blocked_until = None
    db.add(user)


def update_role(db: Session, user: User, role: str):
    user.role = role
    db.add(user)


def create_user(db: Session, username: str, hashed_password: str, role: str):
    user = User(
        username=username,
        hashed_password=hashed_password,
        role=role
    )
    db.add(user)
    return user