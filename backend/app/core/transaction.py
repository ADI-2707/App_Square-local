from functools import wraps
from sqlalchemy.orm import Session
from app.services.log_service import flush_deferred_logs, clear_deferred_logs


def transactional(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        db: Session = kwargs.get("db")

        if not db:
            raise RuntimeError(
                "Database session not provided to transactional function"
            )

        try:
            result = func(*args, **kwargs)
            db.commit()
            flush_deferred_logs(db)
            return result
        
        except Exception:
            db.rollback()
            clear_deferred_logs(db)
            raise

    return wrapper