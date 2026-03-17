from functools import wraps
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.log_service import add_log


def command_logger(action: str):

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):

            current_user = kwargs.get("current_user")
            request_obj: Request = kwargs.get("request_obj")

            endpoint = None
            method = None

            if request_obj:
                endpoint = request_obj.url.path
                method = request_obj.method

            try:
                result = func(*args, **kwargs)

                _log_independent(
                    user=current_user,
                    action=action,
                    status="SUCCESS",
                    endpoint=endpoint,
                    method=method
                )

                return result

            except HTTPException as e:
                if request_obj:
                    request_obj.state.already_logged = True

                _log_independent(
                    user=current_user,
                    action=action,
                    status="FAILURE",
                    endpoint=endpoint,
                    method=method,
                    error_type=str(e.status_code),
                    error_message=e.detail
                )

                raise

            except Exception as e:

                if request_obj:
                    request_obj.state.already_logged = True

                _log_independent(
                    user=current_user,
                    action=action,
                    status="FAILURE",
                    endpoint=endpoint,
                    method=method,
                    error_type="INTERNAL_ERROR",
                    error_message=str(e)
                )

                raise

        return wrapper

    return decorator



def _log_independent(
    user,
    action,
    status,
    endpoint=None,
    method=None,
    error_type=None,
    error_message=None
):
    db = SessionLocal()

    try:
        add_log(
            db=db,
            user=user,
            action=action,
            status=status,
            endpoint=endpoint,
            method=method,
            error_type=error_type,
            error_message=error_message
        )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()