from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.log_service import add_log


class ExceptionLoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        try:
            response = await call_next(request)

            if (
                response.status_code >= 400
                and not getattr(request.state, "already_logged", False)
            ):

                log_db: Session = SessionLocal()

                try:
                    add_log(
                        db=log_db,
                        user=None,
                        action="HTTP_ERROR",
                        status="FAILURE",
                        endpoint=request.url.path,
                        method=request.method,
                        error_type=str(response.status_code),
                        error_message=f"HTTP {response.status_code}"
                    )
                    log_db.commit()
                except Exception:
                    log_db.rollback()
                finally:
                    log_db.close()

            return response

        except Exception as e:

            if getattr(request.state, "already_logged", False):
                raise

            log_db: Session = SessionLocal()

            try:
                add_log(
                    db=log_db,
                    user=None,
                    action="UNHANDLED_EXCEPTION",
                    status="FAILURE",
                    endpoint=request.url.path,
                    method=request.method,
                    error_type="500",
                    error_message=str(e)
                )
                log_db.commit()
            except Exception:
                log_db.rollback()
            finally:
                log_db.close()

            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )