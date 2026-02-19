import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.log_service import add_log
from app.utils.jwt_handler import decode_access_token


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        db: Session = SessionLocal()

        actor = "SYSTEM"
        status = "SUCCESS"
        error_type = None
        error_message = None

        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                actor = payload.get("sub", "UNKNOWN")
        except Exception:
            actor = "UNKNOWN"

        try:
            response = await call_next(request)
            return response

        except Exception as e:
            status = "ERROR"
            error_type = type(e).__name__
            error_message = str(e)
            raise e

        finally:
            process_time = time.time() - start_time

            try:
                add_log(
                    db=db,
                    actor=actor,
                    action=f"{request.method} {request.url.path}",
                    status=status,
                    endpoint=str(request.url.path),
                    method=request.method,
                    error_type=error_type,
                    error_message=error_message,
                )
            except Exception:
                pass
            finally:
                db.close()
