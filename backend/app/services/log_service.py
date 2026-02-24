from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.log import Log
from app.models.user import User

RETENTION_DAYS = 90


def _resolve_actor(user: User | None) -> str | None:
    if not user:
        return None

    if user.username == "admin":
        return "A"

    if user.username == "guest":
        return "G"

    return None


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

    if actor is None:
        return

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


def cleanup_old_logs(db: Session):
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    db.query(Log).filter(Log.timestamp < cutoff_date).delete()
    db.commit()