from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.models import user, log
from app.services.auth_service import initialize_system_users
from app.routes import auth_routes, admin_routes
from app.services.log_service import cleanup_old_logs
from app.utils.error_middleware import ExceptionLoggingMiddleware

app = FastAPI(title="App Square Local")
app.add_middleware(ExceptionLoggingMiddleware)

Base.metadata.create_all(bind=engine)

db = SessionLocal()
initialize_system_users(db)
cleanup_old_logs(db)
db.close()

app.include_router(auth_routes.router)
app.include_router(admin_routes.router)