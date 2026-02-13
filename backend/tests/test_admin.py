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
