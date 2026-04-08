from sqlalchemy.orm import Session
from app.models.user import User
from app.queries import log_queries
from datetime import timezone
import pytz

RETENTION_DAYS = 90
IST = pytz.timezone("Asia/Kolkata")


def _resolve_actor(user: User | None) -> str:
    if not user:
        return "SYS"

    if user.actor_code:
        return user.actor_code

    return "SYS"


def convert_utc_to_ist(dt):
    if not dt:
        return None
    return dt.replace(tzinfo=timezone.utc).astimezone(IST)


def add_log(
    db: Session,
    user: User | None,
    action: str,
    status: str,
    endpoint: str = None,
    method: str = None,
    error_type: str = None,
    error_message: str = None,
    level: str = "INFO",
    traceback_str: str = None,
    request_id: str = None
):
    if not user and endpoint in ["/auth/profile", "/auth/logout"]:
        return

    actor = _resolve_actor(user)

    log = log_queries.create_log(
        db=db,
        actor=actor,
        action=action,
        status=status,
        level=level,
        endpoint=endpoint,
        method=method,
        error_type=error_type,
        error_message=error_message,
        traceback=traceback_str,
        request_id=request_id
    )

    db.add(log)

    try:
        db.commit()
    except Exception:
        db.rollback()

def cleanup_old_logs(db: Session):
    log_queries.delete_older_than(db, RETENTION_DAYS)