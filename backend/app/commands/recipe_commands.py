from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import and_

from app.models.recipe import RecipeGroup, Recipe
from app.models.user import User
from app.core.transaction import transactional
from app.core.command_logger import command_logger


@transactional
@command_logger(action="RECIPE_CREATE")
def create_recipe(
    db: Session,
    name: str,
    recipe_group_id: int,
    current_user: User,
    endpoint: str = "/recipes",
    method: str = "POST"
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    group = db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.id == recipe_group_id,
            RecipeGroup.is_deleted == False
        )
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Recipe group not found")

    existing = db.query(Recipe).filter(
        and_(
            Recipe.recipe_group_id == recipe_group_id,
            Recipe.name == name,
            Recipe.is_deleted == False
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Recipe already exists")

    recipe = Recipe(
        name=name.strip(),
        recipe_group_id=recipe_group_id,
        created_by=current_user.id
    )

    db.add(recipe)
    return recipe