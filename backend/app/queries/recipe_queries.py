from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_

from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice,
    RecipeTagValue
)
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance

def get_recipe_groups_by_template(
    db: Session,
    template_group_id: int,
    search: str | None = None
):
    query = db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.template_group_id == template_group_id,
            RecipeGroup.is_deleted == False
        )
    )

    if search:
        query = query.filter(RecipeGroup.name.ilike(f"%{search}%"))

    return query.order_by(RecipeGroup.created_at.desc()).all()


def get_recipes_by_group_paginated(
    db: Session,
    recipe_group_id: int,
    page: int = 1,
    limit: int = 10
):
    offset = (page - 1) * limit

    return db.query(Recipe).filter(
        and_(
            Recipe.recipe_group_id == recipe_group_id,
            Recipe.is_deleted == False
        )
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

    return recipe


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


def soft_delete_recipe(db: Session, recipe: Recipe):
    recipe.is_deleted = True
    
def count_active_recipes_by_group(db: Session, recipe_group_id: int):
    return db.query(Recipe).filter(
        and_(
            Recipe.recipe_group_id == recipe_group_id,
            Recipe.is_deleted == False
        )
    ).count()


def soft_delete_recipe_group(db: Session, group: RecipeGroup):
    group.is_deleted = True


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