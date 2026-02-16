from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.models import user, log
from app.services.auth_service import initialize_system_users
from app.routes import auth_routes, admin_routes, template_routes
from app.services.log_service import cleanup_old_logs
from app.utils.error_middleware import ExceptionLoggingMiddleware

app = FastAPI(title="App Square Local")
app.add_middleware(ExceptionLoggingMiddleware)

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        initialize_system_users(db)
        cleanup_old_logs(db)
    finally:
        db.close()


app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(template_routes.router)