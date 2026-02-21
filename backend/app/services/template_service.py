from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag
from app.models.user import User
from app.services.log_service import add_log

def create_full_template_group(db: Session, data, current_user: User):

    endpoint = "/templates/full"
    method = "POST"

    try:
        existing = db.query(TemplateGroup).filter(
            TemplateGroup.name == data.name
        ).first()

        if existing:
            add_log(
                db=db,
                user=current_user,
                action=f"TEMPLATE_CREATE_{data.name.replace(' ','')}",
                status="FAILURE",
                endpoint=endpoint,
                method=method,
                error_type="DUPLICATE",
                error_message="Template group already exists"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template group already exists"
            )

        group = TemplateGroup(
            name=data.name,
            created_by=current_user.id
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

        add_log(
            db=db,
            user=current_user,
            action=f"TEMPLATE_CREATE_{group.name.replace(' ','')}",
            status="SUCCESS",
            endpoint=endpoint,
            method=method
        )

        return group

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        add_log(
            db=db,
            user=current_user,
            action="TEMPLATE_CREATE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type="INTERNAL_ERROR",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal error")


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
