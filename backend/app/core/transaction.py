from functools import wraps
from sqlalchemy.orm import Session


def transactional(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        db: Session = kwargs.get("db")

        if not db:
            raise RuntimeError("Database session not provided to transactional function")

        try:
            result = func(*args, **kwargs)
            db.commit()
            return result
        except Exception:
            db.rollback()
            raise

    return wrapper