from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.models import user
from app.services.auth_service import create_root_admin

app = FastAPI(title="App Square Local")

Base.metadata.create_all(bind=engine)

db = SessionLocal()
create_root_admin(db)
db.close()

@app.get("/health")
def health():
    return {"status": "running"}
