from functools import wraps
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.services.log_service import add_log


def command_logger(action: str):

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):

            db: Session = kwargs.get("db")
            current_user = kwargs.get("current_user")
            request: Request = kwargs.get("request")

            endpoint = request.url.path if request else None
            method = request.method if request else None

            try:
                result = func(*args, **kwargs)

                add_log(
                    db=db,
                    user=current_user,
                    action=action,
                    status="SUCCESS",
                    endpoint=endpoint,
                    method=method
                )

                if request:
                    request.state.already_logged = True

                return result

            except HTTPException as e:

                add_log(
                    db=db,
                    user=current_user,
                    action=action,
                    status="FAILURE",
                    endpoint=endpoint,
                    method=method,
                    error_type=str(e.status_code),
                    error_message=e.detail
                )

                if request:
                    request.state.already_logged = True

                raise

            except Exception as e:

                add_log(
                    db=db,
                    user=current_user,
                    action=action,
                    status="FAILURE",
                    endpoint=endpoint,
                    method=method,
                    error_type="INTERNAL_ERROR",
                    error_message=str(e)
                )

                if request:
                    request.state.already_logged = True

                raise

        return wrapper

    return decorator