from sqlalchemy.orm import Session, selectinload, joinedload
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
        Recipe.id == recipe_id,
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
        return Exception("Template group not found")

    template_devices = db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == template_group.id
    ).all()

    active_device_names = {d.name for d in template_devices}

    template_tags_map = {
        device.name: {tag.name for tag in device.tags}
        for device in template_devices
    }

    valid_devices_response = []
    removed_tags = []

    for device in recipe.devices:
        if device.device_name not in active_device_names:
            continue

        current_template_tags = template_tags_map.get(device.device_name, set())

        valid_tag_values = []
        for tag_val in device.tag_values:
            if tag_val.tag_name in current_template_tags:
                valid_tag_values.append({
                    "id": tag_val.id,
                    "tag_name": tag_val.tag_name,
                    "value": tag_val.value
                })
            else:
                removed_tags.append(tag_val.tag_name)

        valid_devices_response.append({
            "id": device.id,
            "device_name": device.device_name,
            "tag_values": valid_tag_values
        })

    logs = db.query(TemplateChangeLog).filter(
        and_(
            TemplateChangeLog.template_group_id == template_group.id,
            TemplateChangeLog.change_type.in_(["EQUIPMENT_DELETED", "TAG_DELETED"])
        )
    ).order_by(TemplateChangeLog.created_at.desc()).all()

    new_logs = [
        log for log in logs
        if recipe.last_synced_at is None or log.created_at > recipe.last_synced_at
    ]

    removed_devices = [
        log.entity_name for log in new_logs
        if log.change_type == "EQUIPMENT_DELETED"
    ]

    removed_tags_from_logs = [
        log.entity_name for log in new_logs
        if log.change_type == "TAG_DELETED"
    ]

    response = {
        "id": recipe.id,
        "name": recipe.name,
        "template_group_id": template_group.id,
        "devices": valid_devices_response,
        "changes": [
            {
                "type": log.change_type,
                "name": log.entity_name,
                "device_name": log.device_name,
                "timestamp": log.created_at.isoformat(),
                "label": (
                    (
                        f"Tag '{log.entity_name}' removed from device '{log.device_name}'"
                        if log.device_name
                        else f"Tag '{log.entity_name}' removed from template"
                    )
                    + (f" by {log.deleted_by}" if log.deleted_by else "")
                    if log.change_type == "TAG_DELETED"
                    else (
                        f"Equipment '{log.entity_name}' removed from template"
                        + (f" by {log.deleted_by}" if log.deleted_by else "")
                    )
                )
            }
            for log in new_logs
        ],
        "removed_devices": list(set(removed_devices)),
        "removed_tags": list(set(removed_tags + removed_tags_from_logs))
    }

    recipe.last_synced_at = datetime.utcnow()
    db.commit()

    return response

def get_recipe_group_by_id(db: Session, group_id: int):
    return db.query(RecipeGroup).filter(
            RecipeGroup.id == group_id,
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
            Recipe.id == recipe_id,
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
            TemplateGroup.id == recipe_group.template_group_id,
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
    default_value: float = 0.0
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
        Recipe.recipe_group_id == recipe_group_id
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
        )
    ).all()


def get_recipes_global(
    db: Session,
    search: str = "",
    skip: int = 0,
    limit: int = 10
):
    query = db.query(Recipe).options(
        joinedload(Recipe.recipe_group)
        .joinedload(RecipeGroup.template_group)
    )

    if search:
        query = query.filter(Recipe.name.ilike(f"%{search.strip()}%"))

    total = query.count()

    results = query.order_by(Recipe.created_at.desc()).offset(skip).limit(limit).all()

    return results, total