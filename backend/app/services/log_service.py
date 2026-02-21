from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.log import Log
from app.models.user import User

RETENTION_DAYS = 90


def _resolve_actor(user: User | None) -> str:
    """
    Centralized actor mapping logic.
    """
    if not user:
        return "SYS"

    if user.username == "admin":
        return "A"

    if user.username == "guest":
        return "G"

    return user.username[:5].upper()


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
    try:
        actor = _resolve_actor(user)

        log = Log(
            actor=actor,
            action=action,
            status=status,
            endpoint=endpoint,
            method=method,
            error_type=error_type,
            error_message=error_message,
            timestamp=datetime.utcnow()
        )

        db.add(log)

    except Exception:
        pass


def cleanup_old_logs(db: Session):
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    db.query(Log).filter(Log.timestamp < cutoff_date).delete()
    db.commit()