from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.models import user, log
from app.services.auth_service import initialize_system_users
from app.routes import auth_routes, admin_routes, template_routes, recipe_routes
from app.services.log_service import cleanup_old_logs
from app.utils.error_middleware import ExceptionLoggingMiddleware
from contextlib import asynccontextmanager
from app.config import ALLOWED_ORIGINS

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(ExceptionLoggingMiddleware)

app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(template_routes.router)
app.include_router(recipe_routes.router)