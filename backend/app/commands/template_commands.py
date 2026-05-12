from tokenize import group

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
from app.services.log_service import add_log
from app.services.tag_source_service import resolve_tag_names
from app.models.template_change_log import TemplateChangeLog


@transactional
@command_logger(action="TEMPLATE_CREATE")
def create_full_template_group(
    db: Session,
    data,
    current_user: User,
    request: Request
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    existing = template_queries.get_template_group_by_name(db, data.name)

    if existing:

        add_log(
            db=db,
            user=current_user,
            action="TEMPLATE_CREATE",
            status="FAILURE",
            endpoint=request.url.path,
            method=request.method,
            error_type="400",
            error_message="Template group already exists",
            metadata={
                "template_name": data.name
            }
        )

        raise HTTPException(status_code=400, detail="Template group already exists")

    group = template_queries.create_template_group(
        db=db,
        name=data.name,
        created_by=current_user.id
    )

    for device_data in data.devices:

        if not device_data.name or not device_data.name.strip():
            raise HTTPException(400, "Device name cannot be empty")

        if not device_data.tags:
            raise HTTPException(
                400,
                f"Device '{device_data.name}' must have at least one tag"
            )

        device = template_queries.create_device_instance(
            db=db,
            name=device_data.name,
            type=device_data.type,
            group_id=group.id
        )

        resolved_tags = resolve_tag_names(
            [tag_data.name for tag_data in device_data.tags]
        )

        seen_tags = set()

        for resolved_tag in resolved_tags:
            tag_name = resolved_tag["tag_name"]

            if tag_name in seen_tags:
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate resolved tag '{tag_name}' in device '{device_data.name}'"
                )

            seen_tags.add(tag_name)

            try:
                template_queries.create_tag(
                    db=db,
                    name=tag_name,
                    device_id=device.id
                )
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

    devices = db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == group.id
    ).all()

    devices_response = []

    for device in devices:
        tags = db.query(Tag).filter(
            Tag.device_instance_id == device.id
        ).all()

        devices_response.append({
            "id": device.id,
            "name": device.name,
            "type": device.type,
            "tags": [
                {
                    "id": tag.id,
                    "name": tag.name
                }
                for tag in tags
            ]
        })

    return {
        "id": group.id,
        "name": group.name,
        "devices": devices_response
    }


@transactional
@command_logger(action="TEMPLATE_DELETE")
def delete_template_group(
    db: Session,
    group_id: int,
    current_user: User,
    request: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    group = db.query(TemplateGroup).filter(
        TemplateGroup.id == group_id
    ).first()

    if not group:
        raise HTTPException(404, "Template not found")

        group_name = group.name

    recipe_count = db.query(Recipe).join(
        RecipeGroup,
        Recipe.recipe_group_id == RecipeGroup.id
    ).filter(
        RecipeGroup.template_group_id == group_id
    ).count()

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
    current_user: User,
    request: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

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
        entity_id=device.id,
        deleted_by=current_user.username
    )
    db.add(log)

    db.delete(device)

    return {
        "message": f"{device_name} deleted successfully"
    }


@transactional
@command_logger(action="TEMPLATE_TAG_DELETE")
def delete_tag_from_device(
    db: Session,
    tag_id: int,
    current_user: User,
    request: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    tag = db.query(Tag).filter(Tag.id == tag_id).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    device = tag.device

    if not device:
        raise HTTPException(status_code=400, detail="Tag is not linked to any device")

    template_group_id = device.template_group_id
    tag_name = tag.name

    log = TemplateChangeLog(
        template_group_id=template_group_id,
        change_type="TAG_DELETED",
        entity_name=tag_name,
        entity_id=tag.id,
        device_name=device.name,
        deleted_by=current_user.username
    )
    db.add(log)

    db.delete(tag)

    return {
        "message": f"Tag '{tag_name}' deleted successfully"
    }


@transactional
@command_logger(action="TEMPLATE_DEVICE_ADD")
def add_device_to_template(
    db: Session,
    template_group_id: int,
    data,
    current_user: User,
    request: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    group = db.query(TemplateGroup).filter(TemplateGroup.id == template_group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Template not found")

    if not data.name or not data.name.strip():
        raise HTTPException(400, "Device name cannot be empty")

    if not data.tags:
        raise HTTPException(400, f"Device '{data.name}' must have at least one tag")

    device = template_queries.create_device_instance(
        db=db,
        name=data.name,
        type=data.type,
        group_id=template_group_id
    )
    db.flush()

    resolved_tags = resolve_tag_names([tag_data.name for tag_data in data.tags])
    
    for resolved_tag in resolved_tags:
        tag_name = resolved_tag["tag_name"]
        template_queries.create_tag(db=db, name=tag_name, device_id=device.id)

    log = TemplateChangeLog(
        template_group_id=template_group_id,
        change_type="EQUIPMENT_ADDED",
        entity_name=data.name,
        entity_id=device.id,
        deleted_by=current_user.username
    )
    db.add(log)

    return template_queries.get_full_template(db, template_group_id)


@transactional
@command_logger(action="TEMPLATE_TAGS_ADD")
def add_tags_to_device(
    db: Session,
    device_id: int,
    tags_data,
    current_user: User,
    request: Request = None
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    device = db.query(DeviceInstance).filter(DeviceInstance.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Equipment not found")

    resolved_tags = resolve_tag_names([tag_data.name for tag_data in tags_data])
    
    for resolved_tag in resolved_tags:
        tag_name = resolved_tag["tag_name"]
        try:
            tag = template_queries.create_tag(db=db, name=tag_name, device_id=device.id)
            db.flush()
            
            log = TemplateChangeLog(
                template_group_id=device.template_group_id,
                change_type="TAG_ADDED",
                entity_name=tag_name,
                entity_id=tag.id,
                device_name=device.name,
                deleted_by=current_user.username
            )
            db.add(log)
        except ValueError:
            continue

    return template_queries.get_device_with_tags(db, device_id)
