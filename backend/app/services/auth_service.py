from sqlalchemy.orm import Session
from app.utils.security import hash_password
from app.queries import user_queries
from app.config import ROOT_ADMIN_PASSWORD, GUEST_PASSWORD


def initialize_system_users(db: Session):

    if not ROOT_ADMIN_PASSWORD or not GUEST_PASSWORD:
        raise ValueError("System user passwords must be set in environment variables.")

    try:
        admin = user_queries.get_by_username(db, "admin")

        if not admin:
            user_queries.create_user(
                db=db,
                username="admin",
                hashed_password=hash_password(ROOT_ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
        else:
            admin.hashed_password = hash_password(ROOT_ADMIN_PASSWORD)
            admin.role = "admin"
            admin.is_active = True
            db.add(admin)

        operators = [
            ("operator1", True),
            ("operator2", False),
            ("operator3", False),
            ("operator4", False),
        ]

        for username, is_active in operators:
            existing = user_queries.get_by_username(db, username)

            if not existing:
                user_queries.create_user(
                    db=db,
                    username=username,
                    hashed_password=hash_password(GUEST_PASSWORD),
                    role="operator",
                    is_active=is_active
                )

        db.commit()

    except Exception:
        db.rollback()
        raise