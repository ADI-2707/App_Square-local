from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import hash_password
from app.config import ROOT_ADMIN_PASSWORD, GUEST_PASSWORD


def initialize_system_users(db: Session):
    if not ROOT_ADMIN_PASSWORD or not GUEST_PASSWORD:
        raise ValueError("System user passwords must be set in environment variables.")

    try:
        admin = db.query(User).filter(User.username == "admin").first()
        guest = db.query(User).filter(User.username == "guest").first()

        if not admin:
            admin = User(
                username="admin",
                hashed_password=hash_password(ROOT_ADMIN_PASSWORD),
                role="admin"
            )
            db.add(admin)
        else:
            admin.role="admin"

        if not guest:
            guest = User(
                username="guest",
                hashed_password=hash_password(GUEST_PASSWORD),
                role="guest"
            )
            db.add(guest)

        db.commit()

    except Exception:
        db.rollback()
        raise
