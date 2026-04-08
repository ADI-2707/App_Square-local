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


def create_user(
    db: Session,
    username: str,
    hashed_password: str,
    role: str,
    actor_code: str,
    is_active: bool = True,
):
    user = User(
        username=username,
        hashed_password=hashed_password,
        role=role,
        is_active=is_active,
        actor_code=actor_code
    )
    db.add(user)
    return user


def update_password_and_increment_token(
    db: Session,
    user: User,
    hashed_password: str
):
    user.hashed_password = hashed_password
    user.token_version += 1
    db.add(user)


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_by_role(db: Session, role: str):
    return db.query(User).filter(User.role == role).all()


def toggle_active(db: Session, user: User):
    user.is_active = not user.is_active
    db.add(user)
    return user