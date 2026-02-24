from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class ExceptionLoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response

        except Exception:
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )