from app.models.device import DeviceInstance
from app.models.template_group import TemplateGroup


def get_token(client, username="admin", password="admin123"):
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    return response.json()["access_token"]


def create_template_with_device(client, token, name):
    tg = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": name}
    ).json()["id"]

    client.post(
        f"/templates/groups/{tg}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": f"{name}_Device",
            "type": "Heater",
            "tags": [{"name": "heatTag"}]
        }
    )

    return tg


def test_cross_template_device_injection_blocked(client, db_session):
    token = get_token(client)

    tg1 = create_template_with_device(client, token, "TemplateA")
    tg2 = create_template_with_device(client, token, "TemplateB")

    rg = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "RG1", "template_group_id": tg2}
    ).json()["id"]

    recipe_id = client.post(
        "/recipes",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Recipe1", "recipe_group_id": rg}
    ).json()["id"]

    device_from_tg1 = db_session.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == tg1
    ).first()

    response = client.post(
        f"/recipes/{recipe_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json={"device_instance_id": device_from_tg1.id}
    )

    assert response.status_code == 400


def test_recipe_group_requires_auth(client):
    response = client.post(
        "/recipes/groups",
        json={"name": "NoAuth", "template_group_id": 1}
    )

    assert response.status_code in [401, 403]


def test_add_device_to_nonexistent_recipe(client):
    token = get_token(client)

    response = client.post(
        "/recipes/9999/devices",
        headers={"Authorization": f"Bearer {token}"},
        json={"device_instance_id": 1}
    )

    assert response.status_code == 404


def test_create_recipe_invalid_group(client):
    token = get_token(client)

    response = client.post(
        "/recipes",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Invalid", "recipe_group_id": 9999}
    )

    assert response.status_code == 404


def test_create_recipe_group_invalid_template(client):
    token = get_token(client)

    response = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "InvalidRG", "template_group_id": 9999}
    )

    assert response.status_code == 404
