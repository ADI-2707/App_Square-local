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
                    add_log(
                        db=log_db,
                        user=getattr(request.state, "user", None),
                        action="HTTP_ERROR",
                        status="FAILURE",
                        endpoint=request.url.path,
                        method=request.method,
                        error_type=str(response.status_code),
                        error_message=f"HTTP {response.status_code}",
                        request_id=request.state.request_id
                    )
                    log_db.commit()
                except Exception as log_error:
                    log_db.rollback()
                    print("⚠️ Logging failed (HTTP_ERROR):", log_error)
                finally:
                    log_db.close()

            return response

        except Exception as e:

            print("\n🔥🔥🔥 BACKEND CRASH 🔥🔥🔥")
            traceback.print_exc()
            print("ERROR:", str(e))
            print("END 🔥🔥🔥\n")

            if getattr(request.state, "already_logged", False):
                raise

            log_db: Session = SessionLocal()

            try:
                add_log(
                    db=log_db,
                    user=getattr(request.state, "user", None),
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
                log_db.commit()
            except Exception as log_error:
                log_db.rollback()
                print("⚠️ Logging failed (EXCEPTION):", log_error)
            finally:
                log_db.close()

            return JSONResponse(
                status_code=500,
                content={"detail": str(e)}
            )