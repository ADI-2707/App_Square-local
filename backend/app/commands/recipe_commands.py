from sqlalchemy.orm import Session
from fastapi import HTTPException, Request

from app.models.user import User
from app.core.transaction import transactional
from app.core.command_logger import command_logger
from app.queries import recipe_queries
from app.models.recipe import Recipe, RecipeTagValue


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
    selected_device_ids: list[int],
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

    if not selected_device_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one device must be selected"
        )

    template_group = recipe_queries.get_template_group_for_recipe(
        db,
        group
    )

    if not template_group:
        raise HTTPException(status_code=404, detail="Template group not found")

    valid_devices = recipe_queries.get_devices_by_ids_for_template(
        db=db,
        template_group_id=template_group.id,
        device_ids=selected_device_ids
    )

    if len(valid_devices) != len(selected_device_ids):
        raise HTTPException(
            status_code=400,
            detail="Invalid device selection"
        )

    recipe = recipe_queries.create_recipe(
        db,
        name,
        recipe_group_id,
        current_user.id
    )

    for device in valid_devices:

        recipe_device = recipe_queries.create_recipe_device(
            db,
            recipe.id,
            device.name
        )

        for tag in device.tags:
            recipe_queries.create_recipe_tag_value(
                db,
                recipe_device.id,
                tag.name,
                tag.data_type
            )

    return recipe


@transactional
@command_logger(action="RECIPE_DELETE")
def delete_recipe_command(
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

    recipe_queries.delete_recipe(db, recipe)

    return {"message": "Recipe deleted successfully"}


@transactional
@command_logger(action="RECIPE_GROUP_DELETE")
def delete_recipe_group_command(
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
    
    recipe_queries.delete_recipe_group(db, group)

    return {"message": "Recipe group deleted successfully"}



@transactional
@command_logger(action="RECIPE_UPDATE_VALUES")
def update_recipe_values(
    db: Session,
    recipe_id: int,
    devices: list,
    current_user,
    request=None
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    for device in devices:
        for tag in device.get("tag_values", []):

            raw_value = tag.get("value")

            if raw_value is None or raw_value == "":
                raise HTTPException(
                    status_code=400,
                    detail=f"Value cannot be empty for tag '{tag.get('tag_name', '')}'"
                )

            try:
                value = float(raw_value)
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid numeric value for tag '{tag.get('tag_name', '')}'"
                )

            db.query(RecipeTagValue).filter(
                RecipeTagValue.id == tag["id"]
            ).update({
                "value": value
            })

    return {"message": "Recipe updated successfully"}