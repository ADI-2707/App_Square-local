from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.recipe import (
    RecipeGroup,
    Recipe,
    RecipeDevice,
    RecipeTagValue
)
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag


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
        RecipeGroup.template_group_id == template_group_id,
        RecipeGroup.name == name,
        RecipeGroup.is_deleted == False
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Recipe group already exists"
        )

    group = RecipeGroup(
        name=name,
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
        RecipeGroup.id == recipe_group_id,
        RecipeGroup.is_deleted == False
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Recipe group not found"
        )

    existing = db.query(Recipe).filter(
        Recipe.recipe_group_id == recipe_group_id,
        Recipe.name == name,
        Recipe.is_deleted == False
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Recipe already exists"
        )

    recipe = Recipe(
        name=name,
        recipe_group_id=recipe_group_id,
        created_by=user_id
    )

    db.add(recipe)
    db.flush() 

    template_devices = db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == group.template_group_id
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

        for tag in tags:
            tag_value = RecipeTagValue(
                recipe_device_id=recipe_device.id,
                tag_name=tag.name,
                data_type=tag.data_type,
                value="0"
            )
            db.add(tag_value)

    db.commit()
    db.refresh(recipe)

    return recipe


def get_recipe_groups_by_template(
    db: Session,
    template_group_id: int
):
    return db.query(RecipeGroup).filter(
        RecipeGroup.template_group_id == template_group_id,
        RecipeGroup.is_deleted == False
    ).order_by(RecipeGroup.created_at.desc()).all()


def get_recipes_by_group(
    db: Session,
    recipe_group_id: int
):
    return db.query(Recipe).filter(
        Recipe.recipe_group_id == recipe_group_id,
        Recipe.is_deleted == False
    ).order_by(Recipe.created_at.desc()).all()


def get_full_recipe(
    db: Session,
    recipe_id: int
):
    recipe = db.query(Recipe).options(
        joinedload(Recipe.devices).joinedload(RecipeDevice.tag_values)
    ).filter(
        Recipe.id == recipe_id,
        Recipe.is_deleted == False
    ).first()

    if not recipe:
        raise HTTPException(
            status_code=404,
            detail="Recipe not found"
        )

    return recipe