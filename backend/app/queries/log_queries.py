from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from datetime import datetime, timedelta

from app.models.log import Log


def create_log(
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
    return log


def get_logs_paginated(
    db: Session,
    page: int,
    page_size: int,
    sort_order: str
):
    query = db.query(Log)

    if sort_order == "asc":
        query = query.order_by(asc(Log.timestamp))
    else:
        query = query.order_by(desc(Log.timestamp))

    total = query.count()

    logs = query.offset((page - 1) * page_size).limit(page_size).all()

    return total, logs


def delete_older_than(db: Session, days: int):
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    db.query(Log).filter(Log.timestamp < cutoff_date).delete()