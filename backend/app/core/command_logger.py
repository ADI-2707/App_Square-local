from functools import wraps
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
import traceback

from app.services.log_service import add_log


def command_logger(action: str):

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):

            db: Session = kwargs.get("db")
            current_user = kwargs.get("current_user")
            request: Request = kwargs.get("request") or kwargs.get("request_obj")

            endpoint = request.url.path if request else None
            method = request.method if request else None
            request_id = getattr(request.state, "request_id", None) if request else None

            try:
                result = func(*args, **kwargs)

                add_log(
                    db=db,
                    user=current_user,
                    action=action,
                    status="SUCCESS",
                    endpoint=endpoint,
                    method=method,
                    request_id=request_id
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
                    error_message=e.detail,
                    level="WARNING",
                    request_id=request_id
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
                    error_message=str(e),
                    traceback_str=traceback.format_exc(),
                    level="ERROR",
                    request_id=request_id
                )

                if request:
                    request.state.already_logged = True

                raise

        return wrapper

    return decorator