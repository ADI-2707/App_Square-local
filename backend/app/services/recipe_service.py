from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice,
    RecipeTagValue
)
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag


def create_recipe_group(db: Session, name: str, template_group_id: int, user_id: int):
    template_group = db.query(TemplateGroup).filter(
        TemplateGroup.id == template_group_id
    ).first()

    if not template_group:
        raise HTTPException(status_code=404, detail="Template group not found")

    existing = db.query(RecipeGroup).filter(
        RecipeGroup.template_group_id == template_group_id,
        RecipeGroup.name == name
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Recipe group already exists")

    group = RecipeGroup(
        name=name,
        template_group_id=template_group_id,
        created_by=user_id
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    return group


def create_recipe(db: Session, name: str, recipe_group_id: int, user_id: int):
    group = db.query(RecipeGroup).filter(
        RecipeGroup.id == recipe_group_id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Recipe group not found")

    existing = db.query(Recipe).filter(
        Recipe.recipe_group_id == recipe_group_id,
        Recipe.name == name
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Recipe already exists")

    recipe = Recipe(
        name=name,
        recipe_group_id=recipe_group_id,
        created_by=user_id
    )

    db.add(recipe)
    db.commit()
    db.refresh(recipe)

    return recipe


def add_device_to_recipe(db: Session, recipe_id: int, device_instance_id: int):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    device = db.query(DeviceInstance).filter(
        DeviceInstance.id == device_instance_id
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.template_group_id != recipe.recipe_group.template_group_id:
        raise HTTPException(status_code=400, detail="Device not in template group")

    existing = db.query(RecipeDevice).filter(
        RecipeDevice.recipe_id == recipe_id,
        RecipeDevice.device_instance_id == device_instance_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Device already added")

    recipe_device = RecipeDevice(
        recipe_id=recipe_id,
        device_instance_id=device_instance_id
    )

    db.add(recipe_device)
    db.flush()

    tags = db.query(Tag).filter(
        Tag.device_instance_id == device_instance_id
    ).all()

    for tag in tags:
        tag_value = RecipeTagValue(
            recipe_device_id=recipe_device.id,
            tag_id=tag.id,
            value="0"
        )
        db.add(tag_value)

    db.commit()
    db.refresh(recipe_device)

    return recipe_device
