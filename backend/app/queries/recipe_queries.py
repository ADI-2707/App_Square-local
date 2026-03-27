from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_
from datetime import datetime

from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice,
    RecipeTagValue
)

from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.template_change_log import TemplateChangeLog


def get_recipe_groups_by_template(db, template_group_id, search=None):
    query = db.query(RecipeGroup).filter(
        RecipeGroup.template_group_id == template_group_id
    )

    if search:
        query = query.filter(RecipeGroup.name.ilike(f"%{search}%"))

    return query.order_by(RecipeGroup.created_at.desc()).all()


def get_recipes_by_group_paginated(db, recipe_group_id, page=1, limit=10):
    offset = (page - 1) * limit

    return db.query(Recipe).filter(
        Recipe.recipe_group_id == recipe_group_id
    ).order_by(Recipe.created_at.desc()).offset(offset).limit(limit).all()


def get_full_recipe(db: Session, recipe_id: int):
    recipe = db.query(Recipe).options(
        selectinload(Recipe.devices).selectinload(RecipeDevice.tag_values)
    ).filter(
        and_(
            Recipe.id == recipe_id,
            Recipe.is_deleted == False
        )
    ).first()

    if not recipe:
        return None

    template_group = db.query(TemplateGroup).join(
        RecipeGroup,
        RecipeGroup.template_group_id == TemplateGroup.id
    ).filter(
        RecipeGroup.id == recipe.recipe_group_id
    ).first()

    if not template_group:
        return None

    template_devices = db.query(DeviceInstance).filter(
        and_(
            DeviceInstance.template_group_id == template_group.id,
        )
    ).all()

    active_device_names = {d.name for d in template_devices}

    valid_devices = []
    for device in recipe.devices:
        if device.device_name in active_device_names:
            valid_devices.append(device)

    logs = db.query(TemplateChangeLog).filter(
        and_(
            TemplateChangeLog.template_group_id == template_group.id,
            TemplateChangeLog.change_type == "EQUIPMENT_DELETED"  # ✅ MATCHED
        )
    ).order_by(TemplateChangeLog.created_at.desc()).all()

    new_logs = []
    for log in logs:
        if recipe.last_synced_at is None or log.created_at > recipe.last_synced_at:
            new_logs.append(log)
    removed_devices = [log.entity_name for log in new_logs]

    response = {
        "id": recipe.id,
        "name": recipe.name,

        "devices": [
            {
                "id": d.id,
                "device_name": d.device_name,
                "tag_values": [
                    {
                        "id": tv.id,
                        "tag_name": tv.tag_name,
                        "value": tv.value
                    }
                    for tv in d.tag_values
                ]
            }
            for d in valid_devices
        ],

        "changes": [
            {
                "type": log.change_type,
                "name": log.entity_name,
                "timestamp": log.created_at.isoformat()
            }
            for log in new_logs
        ],

        "removed_devices": removed_devices
    }

    recipe.last_synced_at = datetime.utcnow()
    db.commit()

    return response

def get_recipe_group_by_id(db: Session, group_id: int):
    return db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.id == group_id,
            RecipeGroup.is_deleted == False
        )
    ).first()


def get_recipe_group_by_name(
    db: Session,
    template_group_id: int,
    name: str
):
    return db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.template_group_id == template_group_id,
            RecipeGroup.name == name,
            RecipeGroup.is_deleted == False
        )
    ).first()


def create_recipe_group(
    db: Session,
    name: str,
    template_group_id: int,
    created_by: int
):
    group = RecipeGroup(
        name=name.strip(),
        template_group_id=template_group_id,
        created_by=created_by
    )
    db.add(group)
    return group


def get_recipe_by_id(db: Session, recipe_id: int):
    return db.query(Recipe).filter(
        and_(
            Recipe.id == recipe_id,
            Recipe.is_deleted == False
        )
    ).first()


def get_recipe_by_name(
    db: Session,
    recipe_group_id: int,
    name: str
):
    return db.query(Recipe).filter(
        and_(
            Recipe.recipe_group_id == recipe_group_id,
            Recipe.name == name,
            Recipe.is_deleted == False
        )
    ).first()


def create_recipe(
    db: Session,
    name: str,
    recipe_group_id: int,
    created_by: int
):
    recipe = Recipe(
        name=name.strip(),
        recipe_group_id=recipe_group_id,
        created_by=created_by
    )
    db.add(recipe)
    db.flush()
    return recipe


def get_template_group_for_recipe(
    db: Session,
    recipe_group: RecipeGroup
):
    return db.query(TemplateGroup).filter(
        and_(
            TemplateGroup.id == recipe_group.template_group_id,
            TemplateGroup.is_deleted == False
        )
    ).first()


def create_recipe_device(
    db: Session,
    recipe_id: int,
    device_name: str
):
    recipe_device = RecipeDevice(
        recipe_id=recipe_id,
        device_name=device_name
    )
    db.add(recipe_device)
    db.flush()
    return recipe_device


def create_recipe_tag_value(
    db: Session,
    recipe_device_id: int,
    tag_name: str,
    data_type: str,
    default_value: str = "0"
):
    tag_value = RecipeTagValue(
        recipe_device_id=recipe_device_id,
        tag_name=tag_name,
        data_type=data_type,
        value=default_value
    )
    db.add(tag_value)


def delete_recipe(db: Session, recipe: Recipe):
    db.delete(recipe)
    
def count_active_recipes_by_group(db: Session, recipe_group_id: int):
    return db.query(Recipe).filter(
        and_(
            Recipe.recipe_group_id == recipe_group_id,
            Recipe.is_deleted == False
        )
    ).count()


def delete_recipe_group(db: Session, group: RecipeGroup):
    db.delete(group)


def get_devices_by_ids_for_template(
    db: Session,
    template_group_id: int,
    device_ids: list[int]
):
    if not device_ids:
        return []

    return db.query(DeviceInstance).filter(
        and_(
            DeviceInstance.id.in_(device_ids),
            DeviceInstance.template_group_id == template_group_id,
            DeviceInstance.is_deleted == False
        )
    ).all()