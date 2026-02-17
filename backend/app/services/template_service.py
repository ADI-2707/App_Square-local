from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag

def create_full_template_group(db: Session, data, user_id: int):

    existing = db.query(TemplateGroup).filter(
        TemplateGroup.name == data.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template group already exists"
        )

    try:
        group = TemplateGroup(
            name=data.name,
            created_by=user_id
        )

        db.add(group)
        db.flush()

        for device_data in data.devices:
            device = DeviceInstance(
                name=device_data.name,
                type=device_data.type,
                template_group_id=group.id
            )

            db.add(device)
            db.flush()

            for tag_data in device_data.tags:
                tag = Tag(
                    name=tag_data.name,
                    device_instance_id=device.id
                )
                db.add(tag)

        db.commit()
        db.refresh(group)

        return group

    except Exception:
        db.rollback()
        raise


def get_all_groups(db: Session):
    return db.query(TemplateGroup).all()


def get_devices_by_group(db: Session, group_id: int):
    return db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == group_id
    ).all()


def get_tags_by_device(db: Session, device_id: int):
    return db.query(Tag).filter(
        Tag.device_instance_id == device_id
    ).all()
