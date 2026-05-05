from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import contextlib
import asyncio

from app.database import Base, engine, SessionLocal
from app.models import user, log
from app.services.auth_service import initialize_system_users
from app.services.log_service import cleanup_old_logs
from app.routes import auth_routes, admin_routes, template_routes, recipe_routes
from app.utils.error_middleware import ExceptionLoggingMiddleware
from app.config import ALLOWED_ORIGINS, LOG_CLEANUP_INTERVAL_MINUTES

@asynccontextmanager
async def lifespan(app: FastAPI):
    stop_cleanup = asyncio.Event()

    async def cleanup_loop():
        while not stop_cleanup.is_set():
            await asyncio.sleep(max(LOG_CLEANUP_INTERVAL_MINUTES, 1) * 60)
            db = SessionLocal()
            try:
                cleanup_old_logs(db)
            finally:
                db.close()

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        initialize_system_users(db)
        cleanup_old_logs(db)
    finally:
        db.close()

    cleanup_task = asyncio.create_task(cleanup_loop())

    yield

    stop_cleanup.set()
    cleanup_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await cleanup_task

app = FastAPI(
    title="App Square Local",
    lifespan=lifespan
)

origins = [
    origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin
]

app.add_middleware(ExceptionLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(template_routes.router)
app.include_router(recipe_routes.router)