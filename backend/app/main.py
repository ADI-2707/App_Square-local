from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.models import user, log
from app.services.auth_service import initialize_system_users
from app.routes import auth_routes, admin_routes, template_routes
from app.services.log_service import cleanup_old_logs
from app.utils.error_middleware import ExceptionLoggingMiddleware
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        initialize_system_users(db)
        cleanup_old_logs(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="App Square Local",
    lifespan=lifespan
)

app.add_middleware(ExceptionLoggingMiddleware)


app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(template_routes.router)