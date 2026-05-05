from sqlalchemy.orm import Session
from app.models.user import User
from app.queries import log_queries
from datetime import timezone
from app.database import SessionLocal
from app import config
import pytz
from datetime import datetime

IST = pytz.timezone("Asia/Kolkata")
PENDING_LOGS_KEY = "pending_logs"
LOGGING_FAILURE_COUNT = 0
LAST_CLEANUP_STATUS = "not_run"
LAST_CLEANUP_AT = None


def _resolve_actor(user: User | None = None) -> str:
    try:
        if not user:
            return "SYS"
        
        actor_code = user.__dict__.get("actor_code")
        user_id = user.__dict__.get("id")

        if actor_code:
            return actor_code

        if user_id:
            return f"U{user_id}"

    except Exception:
        pass

    return "SYS"


def convert_utc_to_ist(dt):
    if not dt:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(IST)


def _persist_log(
    *,
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
    global LOGGING_FAILURE_COUNT
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
        LOGGING_FAILURE_COUNT += 1
        print("LOG_PERSIST_FAILURE", str(e))
    finally:
        log_db.close()


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
    defer_until_commit: bool = False,
):
    payload = {
        "user": user,
        "action": action,
        "status": status,
        "endpoint": endpoint,
        "method": method,
        "error_type": error_type,
        "error_message": error_message,
        "level": level,
        "traceback_str": traceback_str,
        "request_id": request_id,
        "metadata": metadata,
    }

    if defer_until_commit and db is not None:
        db.info.setdefault(PENDING_LOGS_KEY, []).append(payload)
        return

    _persist_log(**payload)


def flush_deferred_logs(db: Session):
    pending_logs = db.info.pop(PENDING_LOGS_KEY, [])
    for payload in pending_logs:
        _persist_log(**payload)


def clear_deferred_logs(db: Session):
    db.info.pop(PENDING_LOGS_KEY, None)


def get_logging_health() -> dict:
    return {
        "logging_failures": LOGGING_FAILURE_COUNT,
        "last_cleanup_status": LAST_CLEANUP_STATUS,
        "last_cleanup_at": LAST_CLEANUP_AT.isoformat() if LAST_CLEANUP_AT else None,
    }


def cleanup_old_logs(db: Session):
    global LAST_CLEANUP_STATUS, LAST_CLEANUP_AT
    try:
        log_queries.delete_older_than(db, config.LOG_RETENTION_DAYS)
        db.commit()
        LAST_CLEANUP_STATUS = "ok"
        LAST_CLEANUP_AT = datetime.utcnow()
    except Exception as e:
        db.rollback()
        LAST_CLEANUP_STATUS = "failed"
        LAST_CLEANUP_AT = datetime.utcnow()
        print("LOG_CLEANUP_FAILURE", str(e))