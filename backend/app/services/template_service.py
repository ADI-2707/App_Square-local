from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag

from app.services.log_service import add_log


def get_all_groups(db: Session):
    return db.query(TemplateGroup).filter(
        TemplateGroup.is_deleted == False
    ).all()


def get_devices_by_group(db: Session, group_id: int):
    return db.query(DeviceInstance).filter(
        and_(
            DeviceInstance.template_group_id == group_id,
            DeviceInstance.is_deleted == False
        )
    ).all()


def get_tags_by_device(db: Session, device_id: int):
    return db.query(Tag).filter(
        and_(
            Tag.device_instance_id == device_id,
            Tag.is_deleted == False
        )
    ).all()