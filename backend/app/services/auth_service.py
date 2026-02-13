from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import hash_password

DEFAULT_ADMIN_PASSWORD = "admin123"
DEFAULT_GUEST_PASSWORD = "guest123"

def initialize_system_users(db: Session):
    admin = db.query(User).filter(User.username == "admin").first()
    guest = db.query(User).filter(User.username == "guest").first()

    if not admin:
        admin = User(
            username="admin",
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            role="admin"
        )
        db.add(admin)

    if not guest:
        guest = User(
            username="guest",
            hashed_password=hash_password(DEFAULT_GUEST_PASSWORD),
            role="guest"
        )
        db.add(guest)

    db.commit()