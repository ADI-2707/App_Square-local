from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice,
    RecipeTagValue
)
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag


def get_token(client, username="admin", password="admin123"):
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    return response.json()["access_token"]


def setup_template_with_device(client, token):
    group_resp = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "TemplateA"}
    )

    template_group_id = group_resp.json()["id"]

    device_payload = {
        "name": "Heater1",
        "type": "Heater",
        "tags": [
            {"name": "heatTag"},
            {"name": "tempTag"}
        ]
    }

    client.post(
        f"/templates/groups/{template_group_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json=device_payload
    )

    return template_group_id


def test_create_recipe_group(client, db_session):
    token = get_token(client)

    template_group_id = setup_template_with_device(client, token)

    response = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "MillArea",
            "template_group_id": template_group_id
        }
    )

    assert response.status_code == 200

    group = db_session.query(RecipeGroup).first()
    assert group is not None


def test_duplicate_recipe_group_blocked(client):
    token = get_token(client)

    template_group_id = setup_template_with_device(client, token)

    payload = {
        "name": "MillArea",
        "template_group_id": template_group_id
    }

    client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )

    response = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )

    assert response.status_code == 400


def test_create_recipe(client, db_session):
    token = get_token(client)

    template_group_id = setup_template_with_device(client, token)

    group_resp = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "MillArea",
            "template_group_id": template_group_id
        }
    )

    recipe_group_id = group_resp.json()["id"]

    response = client.post(
        "/recipes",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "8mm",
            "recipe_group_id": recipe_group_id
        }
    )

    assert response.status_code == 200

    recipe = db_session.query(Recipe).first()
    assert recipe is not None


def test_duplicate_recipe_blocked(client):
    token = get_token(client)

    template_group_id = setup_template_with_device(client, token)

    group_resp = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "MillArea",
            "template_group_id": template_group_id
        }
    )

    recipe_group_id = group_resp.json()["id"]

    payload = {
        "name": "8mm",
        "recipe_group_id": recipe_group_id
    }

    client.post("/recipes", headers={"Authorization": f"Bearer {token}"}, json=payload)
    response = client.post("/recipes", headers={"Authorization": f"Bearer {token}"}, json=payload)

    assert response.status_code == 400


def test_add_device_to_recipe_generates_tag_values(client, db_session):
    token = get_token(client)

    template_group_id = setup_template_with_device(client, token)

    group_resp = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "MillArea",
            "template_group_id": template_group_id
        }
    )

    recipe_group_id = group_resp.json()["id"]

    recipe_resp = client.post(
        "/recipes",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "8mm",
            "recipe_group_id": recipe_group_id
        }
    )

    recipe_id = recipe_resp.json()["id"]

    device = db_session.query(DeviceInstance).first()

    response = client.post(
        f"/recipes/{recipe_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json={"device_instance_id": device.id}
    )

    assert response.status_code == 200

    recipe_device = db_session.query(RecipeDevice).first()
    tag_values = db_session.query(RecipeTagValue).all()

    assert recipe_device is not None
    assert len(tag_values) == 2


def test_duplicate_device_in_recipe_blocked(client, db_session):
    token = get_token(client)

    template_group_id = setup_template_with_device(client, token)

    group_resp = client.post(
        "/recipes/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "MillArea",
            "template_group_id": template_group_id
        }
    )

    recipe_group_id = group_resp.json()["id"]

    recipe_resp = client.post(
        "/recipes",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "8mm",
            "recipe_group_id": recipe_group_id
        }
    )

    recipe_id = recipe_resp.json()["id"]

    device = db_session.query(DeviceInstance).first()

    client.post(
        f"/recipes/{recipe_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json={"device_instance_id": device.id}
    )

    response = client.post(
        f"/recipes/{recipe_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json={"device_instance_id": device.id}
    )

    assert response.status_code == 400
