from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import hash_password
from app.config import ROOT_ADMIN_USERNAME, ROOT_ADMIN_PASSWORD

def create_root_admin(db: Session):
    existing = db.query(User).filter(
        User.username == ROOT_ADMIN_USERNAME
    ).first()

    if not existing:
        root = User(
            username=ROOT_ADMIN_USERNAME,
            hashed_password=hash_password(ROOT_ADMIN_PASSWORD),
            role="root"
        )
        db.add(root)
        db.commit()
