from sqlalchemy.orm import Session
from fastapi import HTTPException, Request

from app.models.user import User
from app.models.device import DeviceInstance
from app.core.transaction import transactional
from app.core.command_logger import command_logger
from app.queries import template_queries
from app.models.template_change_log import TemplateChangeLog
from app.models.tag import Tag
from app.models.recipe import RecipeDevice, RecipeGroup, Recipe
from app.models.template_group import TemplateGroup


@transactional
@command_logger(action="TEMPLATE_CREATE")
def create_full_template_group(
    db: Session,
    data,
    current_user: User,
    request: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    existing = template_queries.get_template_group_by_name(db, data.name)

    if existing:
        raise HTTPException(status_code=400, detail="Template group already exists")

    group = template_queries.create_template_group(
        db=db,
        name=data.name,
        created_by=current_user.id
    )

    for device_data in data.devices:
        device = template_queries.create_device_instance(
            db=db,
            name=device_data.name,
            type=device_data.type,
            group_id=group.id
        )

        for tag_data in device_data.tags:
            try:
                template_queries.create_tag(
                    db=db,
                    name=tag_data.name,
                    device_id=device.id
                )
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

    return group


@transactional
@command_logger(action="TEMPLATE_DELETE")
def delete_template_group(
    db: Session,
    group_id: int,
    current_user,
    request=None
):
    group = db.query(TemplateGroup).filter(
        TemplateGroup.id == group_id
    ).first()

    if not group:
        raise HTTPException(404, "Template not found")

    recipe_count = db.query(Recipe).join(
        RecipeGroup,
        Recipe.recipe_group_id == RecipeGroup.id
    ).filter(
        RecipeGroup.template_group_id == group_id
    ).count()

    print(f"Deleting template '{group.name}' with {recipe_count} recipes")

    db.delete(group)

    return {
        "message": "Template deleted successfully",
        "deleted_recipes": recipe_count
    }


@transactional
@command_logger(action="TEMPLATE_DEVICE_DELETE")
def delete_device_from_template(
    db: Session,
    device_id: int,
    current_user,
    request=None
):

    device = db.query(DeviceInstance).filter(
        DeviceInstance.id == device_id
    ).first()

    if not device:
        raise HTTPException(404, "Equipment not found")

    device_name = device.name
    template_group_id = device.template_group_id 

    recipe_devices = db.query(RecipeDevice).filter(
        RecipeDevice.device_name == device_name
    ).all()

    for rd in recipe_devices:
        db.delete(rd)

    log = TemplateChangeLog(
        template_group_id=template_group_id,
        change_type="EQUIPMENT_DELETED",
        entity_name=device_name,
        entity_id=device.id
    )
    db.add(log)

    db.delete(device)

    return {
        "message": f"{device_name} deleted successfully"
    }