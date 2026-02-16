from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag


def get_token(client, username="admin", password="admin123"):
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    return response.json()["access_token"]


def test_admin_can_create_template_group(client, db_session):
    token = get_token(client)

    response = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Group1"}
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Group1"

    group = db_session.query(TemplateGroup).first()
    assert group is not None


def test_guest_cannot_create_template_group(client):
    token = get_token(client, "guest", "guest123")

    response = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "GroupX"}
    )

    assert response.status_code == 403


def test_admin_can_create_device_with_tags(client, db_session):
    token = get_token(client)

    group_response = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Line1"}
    )

    group_id = group_response.json()["id"]

    device_payload = {
        "name": "Heater1",
        "type": "Heater",
        "tags": [
            {"name": "heatTag"},
            {"name": "tempSensor"}
        ]
    }

    response = client.post(
        f"/templates/groups/{group_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json=device_payload
    )

    assert response.status_code == 200

    device = db_session.query(DeviceInstance).first()
    assert device is not None

    tags = db_session.query(Tag).filter(Tag.device_instance_id == device.id).all()
    assert len(tags) == 2


def test_duplicate_device_blocked(client):
    token = get_token(client)

    group_response = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Line2"}
    )

    group_id = group_response.json()["id"]

    device_payload = {
        "name": "Roller1",
        "type": "Roller",
        "tags": [{"name": "speedTag"}]
    }

    client.post(
        f"/templates/groups/{group_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json=device_payload
    )

    response = client.post(
        f"/templates/groups/{group_id}/devices",
        headers={"Authorization": f"Bearer {token}"},
        json=device_payload
    )

    assert response.status_code == 400


def test_guest_cannot_create_device(client):
    admin_token = get_token(client)

    group_response = client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Line3"}
    )

    group_id = group_response.json()["id"]

    guest_token = get_token(client, "guest", "guest123")

    device_payload = {
        "name": "Motor1",
        "type": "Motor",
        "tags": [{"name": "rpmTag"}]
    }

    response = client.post(
        f"/templates/groups/{group_id}/devices",
        headers={"Authorization": f"Bearer {guest_token}"},
        json=device_payload
    )

    assert response.status_code == 403


def test_list_groups(client):
    token = get_token(client)

    client.post(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "GroupListTest"}
    )

    response = client.get(
        "/templates/groups",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
