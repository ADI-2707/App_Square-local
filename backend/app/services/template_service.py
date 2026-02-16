from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag


def create_template_group(db: Session, name: str, user_id: int):
    existing = db.query(TemplateGroup).filter(TemplateGroup.name == name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template group already exists"
        )

    group = TemplateGroup(name=name, created_by=user_id)
    db.add(group)
    db.commit()
    db.refresh(group)

    return group


def create_device(db: Session, group_id: int, data, user_id: int):
    group = db.query(TemplateGroup).filter(TemplateGroup.id == group_id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    existing = db.query(DeviceInstance).filter(
        DeviceInstance.name == data.name,
        DeviceInstance.template_group_id == group_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Device already exists in group")

    device = DeviceInstance(
        name=data.name,
        type=data.type,
        template_group_id=group_id
    )

    db.add(device)
    db.flush()

    for tag_data in data.tags:
        tag = Tag(
            name=tag_data.name,
            device_instance_id=device.id
        )
        db.add(tag)

    db.commit()
    db.refresh(device)

    return device


def get_all_groups(db: Session):
    return db.query(TemplateGroup).all()
