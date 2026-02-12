from fastapi import FastAPI

app = FastAPI(title="App Square Local")

@app.get("/health")
def health():
    return {"status": "running"}