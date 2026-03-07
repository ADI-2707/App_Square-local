from sqlalchemy.orm import Session
from app.queries import template_queries
from app.queries.template_queries import get_device_with_tags

def get_all_groups(db: Session):
    return template_queries.get_all_groups(db)


def get_devices_by_group(db: Session, group_id: int):
    return template_queries.get_devices_by_group(db, group_id)


def get_tags_by_device(db: Session, device_id: int):
    return template_queries.get_tags_by_device(db, device_id)


def get_full_template(db: Session, template_group_id: int):
    return template_queries.get_full_template(db, template_group_id)


def get_device_full(db: Session, device_id: int):
    return get_device_with_tags(db, device_id)