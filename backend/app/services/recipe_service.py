from sqlalchemy.orm import Session, joinedload, selectinload
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import and_
from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice,
    RecipeTagValue
)
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag
from app.models.user import User

from app.services.log_service import add_log

def create_recipe_group(
    db: Session,
    name: str,
    template_group_id: int,
    user_id: int
):
    template_group = db.query(TemplateGroup).filter(
        TemplateGroup.id == template_group_id
    ).first()

    if not template_group:
        raise HTTPException(
            status_code=404,
            detail="Template group not found"
        )

    existing = db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.template_group_id == template_group_id,
            RecipeGroup.name == name,
            RecipeGroup.is_deleted == False
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Recipe group already exists for this template"
        )

    group = RecipeGroup(
        name=name.strip(),
        template_group_id=template_group_id,
        created_by=user_id
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    return group



def create_recipe(
    db: Session,
    name: str,
    recipe_group_id: int,
    user_id: int
):
    group = db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.id == recipe_group_id,
            RecipeGroup.is_deleted == False
        )
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Recipe group not found"
        )

    existing = db.query(Recipe).filter(
        and_(
            Recipe.recipe_group_id == recipe_group_id,
            Recipe.name == name,
            Recipe.is_deleted == False
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Recipe already exists in this group"
        )

    recipe = Recipe(
        name=name.strip(),
        recipe_group_id=recipe_group_id,
        created_by=user_id
    )
    db.add(recipe)
    db.flush()

    template_devices = (
        db.query(DeviceInstance)
        .filter(DeviceInstance.template_group_id == group.template_group_id)
        .order_by(DeviceInstance.id)
        .all()
    )

    if not template_devices:
        db.commit()
        db.refresh(recipe)
        return recipe

    for device in template_devices:
        recipe_device = RecipeDevice(
            recipe_id=recipe.id,
            device_name=device.name
        )
        db.add(recipe_device)
        db.flush()

        tags = (
            db.query(Tag)
            .filter(Tag.device_instance_id == device.id)
            .order_by(Tag.id)
            .all()
        )

        if not tags:
            continue

        tag_values = [
            RecipeTagValue(
                recipe_device_id=recipe_device.id,
                tag_name=tag.name,
                data_type=tag.data_type,
                value="0"
            )
            for tag in tags
        ]

        db.add_all(tag_values)

    db.commit()
    db.refresh(recipe)

    return recipe



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

    recipes = (
        db.query(Recipe)
        .filter(
            and_(
                Recipe.recipe_group_id == recipe_group_id,
                Recipe.is_deleted == False
            )
        )
        .order_by(Recipe.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return recipes



def get_full_recipe(
    db: Session,
    recipe_id: int
):
    recipe = (
        db.query(Recipe)
        .options(
            selectinload(Recipe.devices).selectinload(RecipeDevice.tag_values)
        )
        .filter(
            and_(
                Recipe.id == recipe_id,
                Recipe.is_deleted == False
            )
        )
        .first()
    )

    if not recipe:
        raise HTTPException(
            status_code=404,
            detail="Recipe not found"
        )

    return recipe


def soft_delete_recipe(
    db: Session,
    recipe_id: int,
    current_user: User
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can delete recipes"
        )

    recipe = db.query(Recipe).filter(
        and_(
            Recipe.id == recipe_id,
            Recipe.is_deleted == False
        )
    ).first()

    if not recipe:
        raise HTTPException(
            status_code=404,
            detail="Recipe not found"
        )

    recipe.is_deleted = True

    db.commit()

    add_log(
        db=db,
        actor=current_user.username,
        action=f"Soft deleted recipe: {recipe.name}",
        status="SUCCESS",
        endpoint=f"/recipes/{recipe_id}",
        method="DELETE"
    )

    return {"message": "Recipe deleted successfully"}