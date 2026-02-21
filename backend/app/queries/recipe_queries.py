from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_
from fastapi import HTTPException

from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice
)


def get_recipe_groups_by_template(db: Session, template_group_id: int, search: str | None = None):

    query = db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.template_group_id == template_group_id,
            RecipeGroup.is_deleted == False
        )
    )

    if search:
        query = query.filter(RecipeGroup.name.ilike(f"%{search}%"))

    return query.order_by(RecipeGroup.created_at.desc()).all()


def get_recipes_by_group_paginated(db: Session, recipe_group_id: int, page: int = 1, limit: int = 10):

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

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return recipe