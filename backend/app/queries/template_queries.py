from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag
from app.models.recipe import RecipeGroup, Recipe

def get_all_groups(db: Session):
    return db.query(TemplateGroup).all()


def get_devices_by_group(db: Session, group_id: int):
    devices = db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == group_id
    ).all()

    return [
        {
            "id": d.id,
            "name": d.name,
            "type": d.type
        }
        for d in devices
    ]


def get_tags_by_device(db: Session, device_id: int):
    return db.query(Tag).filter(
        Tag.device_instance_id == device_id
    ).all()


def get_template_group_by_name(db: Session, name: str):
    return db.query(TemplateGroup).filter(
            TemplateGroup.name == name.strip(),
    ).first()


def get_template_group_by_id(db: Session, group_id: int):
    return db.query(TemplateGroup).filter(
        TemplateGroup.id == group_id
    ).first()


def create_template_group(db: Session, name: str, created_by: int):
    group = TemplateGroup(
        name=name.strip(),
        created_by=created_by
    )
    db.add(group)
    db.flush()
    return group


def create_device_instance(db: Session, name: str, type: str, group_id: int):
    device = DeviceInstance(
        name=name.strip(),
        type=type,
        template_group_id=group_id
    )
    db.add(device)
    db.flush()
    return device


def create_tag(db: Session, name: str, device_id: int):
    normalized_name = name.strip().lower()

    existing = db.query(Tag).filter(
        Tag.name == normalized_name,
        Tag.device_instance_id == device_id
    ).first()

    if existing:
        raise ValueError(f"Tag '{normalized_name}' already exists for this equipment.")

    tag = Tag(
        name=normalized_name,
        device_instance_id=device_id
    )
    db.add(tag)
    return tag



def count_active_recipes_by_template(db: Session, template_group_id: int):
    return db.query(Recipe).join(
        RecipeGroup,
        Recipe.recipe_group_id == RecipeGroup.id
    ).filter(
        RecipeGroup.template_group_id == template_group_id
    ).count()


def get_full_template(db: Session, template_group_id: int):
    group = db.query(TemplateGroup).filter(
        TemplateGroup.id == template_group_id
    ).first()

    if not group:
        return None

    devices = db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == template_group_id
    ).all()

    device_ids = [d.id for d in devices]

    tags = db.query(Tag).filter(
        Tag.device_instance_id.in_(device_ids)
    ).all()

    tag_map = {}
    for tag in tags:
        tag_map.setdefault(tag.device_instance_id, []).append(tag)

    device_list = []

    for device in devices:
        device_tags = tag_map.get(device.id, [])

        device_list.append({
            "id": device.id,
            "device_name": device.name,
            "tag_values": [
                {
                    "tag_name": tag.name,
                    "value": "-"
                }
                for tag in device_tags
            ]
        })

    return {
        "id": group.id,
        "name": group.name,
        "devices": device_list
    }


def get_device_with_tags(db: Session, device_id: int):
    device = db.query(DeviceInstance).filter(
            DeviceInstance.id == device_id,
    ).first()

    if not device:
        return None

    tags = db.query(Tag).filter(
            Tag.device_instance_id == device_id,
    ).all()

    return {
        "id": device.id,
        "device_name": device.name,
        "tag_values": [
            {
                "tag_name": tag.name,
                "value": "-"
            }
            for tag in tags
        ]
    }