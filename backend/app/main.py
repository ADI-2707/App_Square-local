from fastapi import FastAPI
from app.database import Base, engine

app = FastAPI(title="App Square Local")

Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "running"}
