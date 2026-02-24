from sqlalchemy.orm import Session
from app.utils.security import hash_password
from app.queries import user_queries
from app.config import ROOT_ADMIN_PASSWORD, GUEST_PASSWORD


def initialize_system_users(db: Session):

    if not ROOT_ADMIN_PASSWORD or not GUEST_PASSWORD:
        raise ValueError("System user passwords must be set in environment variables.")

    try:
        admin = user_queries.get_by_username(db, "admin")
        guest = user_queries.get_by_username(db, "guest")

        if not admin:
            user_queries.create_user(
                db=db,
                username="admin",
                hashed_password=hash_password(ROOT_ADMIN_PASSWORD),
                role="admin"
            )
        else:
            user_queries.update_role(db, admin, "admin")

        if not guest:
            user_queries.create_user(
                db=db,
                username="guest",
                hashed_password=hash_password(GUEST_PASSWORD),
                role="guest"
            )

        db.commit()

    except Exception:
        db.rollback()
        raise