from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException

from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag
from app.models.recipe import RecipeGroup, Recipe
from app.models.user import User

from app.core.transaction import transactional
from app.core.command_logger import command_logger


@transactional
@command_logger(action="TEMPLATE_CREATE")
def create_full_template_group(
    db: Session,
    data,
    current_user: User,
    endpoint: str = "/templates/full",
    method: str = "POST"
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    existing = db.query(TemplateGroup).filter(
        and_(
            TemplateGroup.name == data.name,
            TemplateGroup.is_deleted == False
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Template group already exists")

    group = TemplateGroup(
        name=data.name.strip(),
        created_by=current_user.id
    )

    db.add(group)
    db.flush()

    for device_data in data.devices:
        device = DeviceInstance(
            name=device_data.name.strip(),
            type=device_data.type,
            template_group_id=group.id
        )
        db.add(device)
        db.flush()

        for tag_data in device_data.tags:
            tag = Tag(
                name=tag_data.name.strip(),
                device_instance_id=device.id
            )
            db.add(tag)

    return group


@transactional
@command_logger(action="TEMPLATE_DELETE")
def soft_delete_template_group(
    db: Session,
    group_id: int,
    current_user: User,
    endpoint: str = None,
    method: str = "DELETE"
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")

    group = db.query(TemplateGroup).filter(
        and_(
            TemplateGroup.id == group_id,
            TemplateGroup.is_deleted == False
        )
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Template group not found")

    group.is_deleted = True

    db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == group_id
    ).update({"is_deleted": True}, synchronize_session=False)

    db.query(Tag).filter(
        Tag.device_instance_id.in_(
            db.query(DeviceInstance.id)
            .filter(DeviceInstance.template_group_id == group_id)
        )
    ).update({"is_deleted": True}, synchronize_session=False)

    recipe_groups = db.query(RecipeGroup).filter(
        RecipeGroup.template_group_id == group_id
    ).all()

    for rg in recipe_groups:
        rg.is_deleted = True
        db.query(Recipe).filter(
            Recipe.recipe_group_id == rg.id
        ).update({"is_deleted": True})

    return {"message": "Template group deleted successfully"}