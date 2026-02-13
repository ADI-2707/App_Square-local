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
