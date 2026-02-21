from sqlalchemy.orm import Session, selectinload
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
    current_user: User
):
    endpoint = "/recipes/groups"
    method = "POST"

    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

        template_group = db.query(TemplateGroup).filter(
            and_(
                TemplateGroup.id == template_group_id,
                TemplateGroup.is_deleted == False
            )
        ).first()

        if not template_group:
            raise HTTPException(status_code=404, detail="Template group not found")

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
        db.commit()
        db.refresh(group)

        add_log(
            db=db,
            user=current_user,
            action=f"RECIPE_GROUP_CREATE_{group.name.replace(' ','')}",
            status="SUCCESS",
            endpoint=endpoint,
            method=method
        )

        return group

    except HTTPException as e:
        add_log(
            db=db,
            user=current_user,
            action="RECIPE_GROUP_CREATE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type=str(e.status_code),
            error_message=e.detail
        )
        raise

    except Exception as e:
        db.rollback()
        add_log(
            db=db,
            user=current_user,
            action="RECIPE_GROUP_CREATE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type="INTERNAL_ERROR",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal error")



def create_recipe(
    db: Session,
    name: str,
    recipe_group_id: int,
    current_user: User
):
    endpoint = "/recipes"
    method = "POST"

    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

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
        db.flush()

        template_devices = db.query(DeviceInstance).filter(
            and_(
                DeviceInstance.template_group_id == group.template_group_id,
                DeviceInstance.is_deleted == False
            )
        ).order_by(DeviceInstance.id).all()

        for device in template_devices:
            recipe_device = RecipeDevice(
                recipe_id=recipe.id,
                device_name=device.name
            )
            db.add(recipe_device)
            db.flush()

            tags = db.query(Tag).filter(
                Tag.device_instance_id == device.id
            ).order_by(Tag.id).all()

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

        add_log(
            db=db,
            user=current_user,
            action=f"RECIPE_CREATE_{recipe.name.replace(' ','')}",
            status="SUCCESS",
            endpoint=endpoint,
            method=method
        )

        return recipe

    except HTTPException as e:
        add_log(
            db=db,
            user=current_user,
            action="RECIPE_CREATE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type=str(e.status_code),
            error_message=e.detail
        )
        raise

    except Exception as e:
        db.rollback()
        add_log(
            db=db,
            user=current_user,
            action="RECIPE_CREATE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type="INTERNAL_ERROR",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal error")



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



def soft_delete_recipe(db: Session, recipe_id: int, current_user: User):

    endpoint = f"/recipes/{recipe_id}"
    method = "DELETE"

    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

        recipe = db.query(Recipe).filter(
            and_(
                Recipe.id == recipe_id,
                Recipe.is_deleted == False
            )
        ).first()

        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")

        recipe.is_deleted = True
        db.commit()

        add_log(
            db=db,
            user=current_user,
            action=f"RECIPE_DELETE_{recipe.name.replace(' ','')}",
            status="SUCCESS",
            endpoint=endpoint,
            method=method
        )

        return {"message": "Recipe deleted successfully"}

    except HTTPException as e:
        add_log(
            db=db,
            user=current_user,
            action="RECIPE_DELETE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type=str(e.status_code),
            error_message=e.detail
        )
        raise

    except Exception as e:
        db.rollback()
        add_log(
            db=db,
            user=current_user,
            action="RECIPE_DELETE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type="INTERNAL_ERROR",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal error")