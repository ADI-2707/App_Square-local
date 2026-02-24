from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.core.transaction import transactional
from app.core.command_logger import command_logger
from app.queries import template_queries


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

    existing = template_queries.get_template_group_by_name(db, data.name)

    if existing:
        raise HTTPException(status_code=400, detail="Template group already exists")

    group = template_queries.create_template_group(
        db,
        data.name,
        current_user.id
    )

    for device_data in data.devices:
        device = template_queries.create_device_instance(
            db,
            device_data.name,
            device_data.type,
            group.id
        )

        for tag_data in device_data.tags:
            template_queries.create_tag(
                db,
                tag_data.name,
                device.id
            )

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

    group = template_queries.get_template_group_by_id(db, group_id)

    if not group:
        raise HTTPException(status_code=404, detail="Template group not found")

    template_queries.soft_delete_template_group_cascade(db, group)

    return {"message": "Template group deleted successfully"}