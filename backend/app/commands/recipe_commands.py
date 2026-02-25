from sqlalchemy.orm import Session
from fastapi import HTTPException, Request

from app.models.user import User
from app.core.transaction import transactional
from app.core.command_logger import command_logger
from app.queries import recipe_queries


@transactional
@command_logger(action="RECIPE_GROUP_CREATE")
def create_recipe_group(
    db: Session,
    name: str,
    template_group_id: int,
    current_user: User,
    request: Request = None
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    existing = recipe_queries.get_recipe_group_by_name(
        db,
        template_group_id,
        name
    )

    if existing:
        raise HTTPException(status_code=400, detail="Recipe group already exists")

    group = recipe_queries.create_recipe_group(
        db,
        name,
        template_group_id,
        current_user.id
    )

    return group


@transactional
@command_logger(action="RECIPE_CREATE")
def create_recipe(
    db: Session,
    name: str,
    recipe_group_id: int,
    current_user: User,
    request: Request = None
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    group = recipe_queries.get_recipe_group_by_id(db, recipe_group_id)

    if not group:
        raise HTTPException(status_code=404, detail="Recipe group not found")

    existing = recipe_queries.get_recipe_by_name(
        db,
        recipe_group_id,
        name
    )

    if existing:
        raise HTTPException(status_code=400, detail="Recipe already exists")

    recipe = recipe_queries.create_recipe(
        db,
        name,
        recipe_group_id,
        current_user.id
    )

    template_group = recipe_queries.get_template_group_for_recipe(
        db,
        group
    )

    if not template_group:
        raise HTTPException(status_code=404, detail="Template group not found")

    for device in template_group.devices:
        if device.is_deleted:
            continue

        recipe_device = recipe_queries.create_recipe_device(
            db,
            recipe.id,
            device.name
        )

        for tag in device.tags:
            if tag.is_deleted:
                continue

            recipe_queries.create_recipe_tag_value(
                db,
                recipe_device.id,
                tag.name,
                tag.data_type
            )

    return recipe


@transactional
@command_logger(action="RECIPE_DELETE")
def soft_delete_recipe(
    db: Session,
    recipe_id: int,
    current_user: User,
    request: Request = None
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    recipe = recipe_queries.get_recipe_by_id(db, recipe_id)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe_queries.soft_delete_recipe(db, recipe)

    return {"message": "Recipe deleted successfully"}


@transactional
@command_logger(action="RECIPE_GROUP_DELETE")
def soft_delete_recipe_group_command(
    db: Session,
    recipe_group_id: int,
    current_user: User,
    request: Request = None
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    group = recipe_queries.get_recipe_group_by_id(db, recipe_group_id)

    if not group:
        raise HTTPException(status_code=404, detail="Recipe group not found")

    active_count = recipe_queries.count_active_recipes_by_group(
        db,
        recipe_group_id
    )

    if active_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete recipe group with existing recipes"
        )

    recipe_queries.soft_delete_recipe_group(db, group)

    return {"message": "Recipe group deleted successfully"}