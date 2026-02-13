def get_admin_token(client):
    response = client.post("/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.json()["access_token"]


def test_password_change(client):
    token = get_admin_token(client)

    response = client.put(
        "/admin/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "target_user": "guest",
            "new_password": "newpass123"
        }
    )

    assert response.status_code == 200


def test_admin_can_view_logs(client):
    token = get_admin_token(client)

    response = client.get(
        "/admin/logs",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert "logs" in response.json()


def test_system_error_logging(client):
    response = client.get("/non-existent-route")
    assert response.status_code in [404, 500]