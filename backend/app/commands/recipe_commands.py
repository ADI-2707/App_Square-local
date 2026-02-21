from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import and_

from app.models.recipe import RecipeGroup, Recipe
from app.models.user import User
from app.core.transaction import transactional
from app.core.command_logger import command_logger



@transactional
@command_logger(action="RECIPE_GROUP_CREATE")
def create_recipe_group(
    db: Session,
    name: str,
    template_group_id: int,
    current_user: User,
    endpoint: str = "/recipes/groups",
    method: str = "POST"
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    existing = db.query(RecipeGroup).filter(
        and_(
            RecipeGroup.template_group_id == template_group_id,
            RecipeGroup.name == name,
            RecipeGroup.is_deleted == False
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Recipe group already exists")

    group = RecipeGroup(
        name=name.strip(),
        template_group_id=template_group_id,
        created_by=current_user.id
    )

    db.add(group)
    return group



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



@transactional
@command_logger(action="RECIPE_DELETE")
def soft_delete_recipe(
    db: Session,
    recipe_id: int,
    current_user: User,
    endpoint: str = None,
    method: str = "DELETE"
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    recipe = db.query(Recipe).filter(
        and_(
            Recipe.id == recipe_id,
            Recipe.is_deleted == False
        )
    ).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.is_deleted = True
    return {"message": "Recipe deleted successfully"}