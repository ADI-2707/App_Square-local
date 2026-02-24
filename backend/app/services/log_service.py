from sqlalchemy.orm import Session
from app.models.user import User
from app.queries import log_queries

RETENTION_DAYS = 90


def _resolve_actor(user: User | None) -> str:

    if not user:
        return "SYS"

    username = getattr(user, "username", None)

    if username == "admin":
        return "A"

    if username == "guest":
        return "G"

    return "USER"


def add_log(
    db: Session,
    user: User | None,
    action: str,
    status: str,
    endpoint: str = None,
    method: str = None,
    error_type: str = None,
    error_message: str = None
):
    actor = _resolve_actor(user)

    try:
        log_queries.create_log(
            db=db,
            actor=actor,
            action=action,
            status=status,
            endpoint=endpoint,
            method=method,
            error_type=error_type,
            error_message=error_message
        )
    except Exception:
        pass


def cleanup_old_logs(db: Session):
    log_queries.delete_older_than(db, RETENTION_DAYS)