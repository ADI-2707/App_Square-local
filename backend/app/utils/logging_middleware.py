import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.log_service import add_log


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        start_time = time.time()
        db: Session = SessionLocal()

        status = "SUCCESS"
        error_type = None
        error_message = None

        try:
            response: Response = await call_next(request)
            return response

        except Exception as e:
            status = "ERROR"
            error_type = type(e).__name__
            error_message = str(e)
            raise

        finally:
            process_time = round(time.time() - start_time, 4)

            try:
                add_log(
                    db=db,
                    user=None,
                    action=f"{request.method} {request.url.path}",
                    status=status,
                    endpoint=str(request.url.path),
                    method=request.method,
                    error_type=error_type,
                    error_message=error_message,
                )

                db.commit()

            except Exception:
                db.rollback()

            finally:
                db.close()