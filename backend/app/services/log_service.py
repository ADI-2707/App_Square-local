from sqlalchemy.orm import Session
from app.models.user import User
from app.queries import log_queries
from datetime import timezone
from app.database import SessionLocal
import pytz

RETENTION_DAYS = 90
IST = pytz.timezone("Asia/Kolkata")


def _resolve_actor(user: User | None) -> str:
    if not user:
        return "SYS"

    if getattr(user, "actor_code", None):
        return user.actor_code

    return "SYS"


def convert_utc_to_ist(dt):
    if not dt:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(IST)


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
    request_id: str = None,
    metadata: dict = None,
):
    
    if not user and endpoint in ["/auth/profile", "/auth/logout"]:
        return

    actor = _resolve_actor(user)

    log_db = SessionLocal()

    try:
        log_queries.create_log(
            db=log_db,
            actor=actor,
            action=action,
            status=status,
            level=level,
            endpoint=endpoint,
            method=method,
            error_type=error_type,
            error_message=error_message,
            traceback=traceback_str,
            request_id=request_id,
            extra_data=metadata,
        )

        log_db.commit()

    except Exception as e:
        log_db.rollback()
        print("⚠️ Logging failed:", str(e))

    finally:
        log_db.close()


def cleanup_old_logs(db: Session):
    try:
        log_queries.delete_older_than(db, RETENTION_DAYS)
    except Exception as e:
        print("⚠️ Log cleanup failed:", str(e))