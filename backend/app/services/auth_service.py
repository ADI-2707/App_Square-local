from sqlalchemy.orm import Session
from app.utils.security import hash_password
from app.queries import user_queries
from app.config import ROOT_ADMIN_PASSWORD, ROOT_ADMIN_USERNAME


def initialize_system_users(db: Session):

    if not ROOT_ADMIN_PASSWORD or not ROOT_ADMIN_USERNAME:
        raise ValueError("Admin credentials must be set in environment variables.")

    try:
        admin = user_queries.get_by_username(db, ROOT_ADMIN_USERNAME)

        if not admin:
            user_queries.create_user(
                db=db,
                username=ROOT_ADMIN_USERNAME,
                hashed_password=hash_password(ROOT_ADMIN_PASSWORD),
                role="admin",
                actor_code="A",
                is_active=True
            )
        else:
            admin.hashed_password = hash_password(ROOT_ADMIN_PASSWORD)
            admin.role = "admin"
            admin.actor_code = "A"
            admin.is_active = True
            db.add(admin)

        operators = [
            ("operator1", True, "O1"),
            ("operator2", False, "O2"),
            ("operator3", False, "O3"),
            ("operator4", False, "O4"),
        ]

        for username, is_active, actor_code in operators:
            existing = user_queries.get_by_username(db, username)

            if not existing:
                user_queries.create_user(
                    db=db,
                    username=username,
                    hashed_password=hash_password("operators"),
                    role="operator",
                    actor_code=actor_code,
                    is_active=is_active
                )
            else:
                existing.role = "operator"
                existing.actor_code = actor_code
                existing.is_active = is_active
                db.add(existing)

        db.commit()

    except Exception:
        db.rollback()
        raise