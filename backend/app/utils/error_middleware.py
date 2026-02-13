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
            return response

        except Exception as exc:
            db: Session = SessionLocal()

            try:
                add_log(
                    db=db,
                    actor="SYS",
                    action="SYSTEM_ERROR",
                    status="ERROR"
                )
            finally:
                db.close()

            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
