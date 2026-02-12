from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.models import user
from app.services.auth_service import create_root_admin
from app.routes import auth_routes, user_routes

app = FastAPI(title="App Square Local")

Base.metadata.create_all(bind=engine)

db = SessionLocal()
create_root_admin(db)
db.close()

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
