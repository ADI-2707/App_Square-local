from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
import traceback
import uuid

from app.database import SessionLocal
from app.services.log_service import add_log


class ExceptionLoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        if not hasattr(request.state, "request_id"):
            request.state.request_id = str(uuid.uuid4())

        try:
            response = await call_next(request)

            if (
                response.status_code >= 400
                and not getattr(request.state, "already_logged", False)
            ):
                log_db: Session = SessionLocal()

                try:
                    error_message = f"HTTP {response.status_code}"

                    user_obj = getattr(request.state, "user", None)

                    add_log(
                        db=log_db,
                        user=user_obj if user_obj and hasattr(user_obj, "__dict__") else None,
                        action="HTTP_ERROR",
                        status="FAILURE",
                        endpoint=request.url.path,
                        method=request.method,
                        error_type=str(response.status_code),
                        error_message=error_message,
                        request_id=request.state.request_id
                    )
                finally:
                    log_db.close()

            return response

        except Exception as e:

            if getattr(request.state, "already_logged", False):
                raise

            log_db: Session = SessionLocal()

            try:
                user_obj = getattr(request.state, "user", None)

                add_log(
                    db=log_db,
                    user=user_obj if user_obj and hasattr(user_obj, "__dict__") else None,
                    action="UNHANDLED_EXCEPTION",
                    status="FAILURE",
                    endpoint=request.url.path,
                    method=request.method,
                    error_type="500",
                    error_message=str(e),
                    traceback_str=traceback.format_exc(),
                    level="CRITICAL",
                    request_id=request.state.request_id
                )
            finally:
                log_db.close()

            return JSONResponse(
                status_code=500,
                content={
                    "detail": str(e),
                    "trace": traceback.format_exc()
                }
            )