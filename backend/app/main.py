from fastapi import FastAPI
from app.database import Base, engine
from app.models import user

app = FastAPI(title="App Square Local")

Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "running"}