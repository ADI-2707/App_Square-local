from functools import wraps
from fastapi import HTTPException
from app.services.log_service import add_log


def command_logger(action: str):

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):

            db = kwargs.get("db")
            current_user = kwargs.get("current_user")

            endpoint = kwargs.get("endpoint", None)
            method = kwargs.get("method", None)

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
                raise

        return wrapper

    return decorator