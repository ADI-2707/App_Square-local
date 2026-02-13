from app.database import SessionLocal
from app.models.log import Log

def test_login_failure(client):
    response = client.post("/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_login_success(client):
    response = client.post("/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_lockout_after_failed_attempts(client):
    for _ in range(5):
        client.post("/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })

    response = client.post("/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })

    assert response.status_code == 429


def test_login_blocked_log_created(client):
    db = SessionLocal()

    log = db.query(Log).filter(Log.action == "LOGIN_BLOCKED").first()

    db.close()

    assert log is not None
    assert log.actor == "A"
    assert log.status == "FAILURE"