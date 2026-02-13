from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.log import Log


RETENTION_DAYS = 90


def add_log(
    db: Session,
    actor: str,
    action: str,
    status: str,
    endpoint: str = None,
    method: str = None,
    error_type: str = None,
    error_message: str = None
):
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
    db.commit()


def cleanup_old_logs(db: Session):
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)

    db.query(Log).filter(Log.timestamp < cutoff_date).delete()
    db.commit()