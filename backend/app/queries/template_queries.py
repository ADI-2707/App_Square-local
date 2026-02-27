from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag
from app.models.recipe import RecipeGroup, Recipe

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


def get_template_group_by_name(db: Session, name: str):
    return db.query(TemplateGroup).filter(
        and_(
            TemplateGroup.name == name,
            TemplateGroup.is_deleted == False
        )
    ).first()


def get_template_group_by_id(db: Session, group_id: int):
    return db.query(TemplateGroup).filter(
        and_(
            TemplateGroup.id == group_id,
            TemplateGroup.is_deleted == False
        )
    ).first()


def create_template_group(db: Session, name: str, created_by: int):
    group = TemplateGroup(
        name=name.strip(),
        created_by=created_by
    )
    db.add(group)
    db.flush()
    return group


def create_device_instance(db: Session, name: str, type: str, group_id: int):
    device = DeviceInstance(
        name=name.strip(),
        type=type,
        template_group_id=group_id
    )
    db.add(device)
    db.flush()
    return device


def create_tag(db: Session, name: str, device_id: int):
    normalized_name = name.strip().lower()

    existing = db.query(Tag).filter(
        Tag.name == normalized_name,
        Tag.is_deleted == False
    ).first()

    if existing:
        raise ValueError(f"Tag '{normalized_name}' already exists")

    tag = Tag(
        name=normalized_name,
        device_instance_id=device_id
    )
    db.add(tag)
    return tag


def soft_delete_template_group_cascade(db: Session, group: TemplateGroup):

    group.is_deleted = True

    db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == group.id
    ).update({"is_deleted": True}, synchronize_session=False)

    db.query(Tag).filter(
        Tag.device_instance_id.in_(
            db.query(DeviceInstance.id)
            .filter(DeviceInstance.template_group_id == group.id)
        )
    ).update({"is_deleted": True}, synchronize_session=False)

    recipe_groups = db.query(RecipeGroup).filter(
        RecipeGroup.template_group_id == group.id
    ).all()

    for rg in recipe_groups:
        rg.is_deleted = True

        db.query(Recipe).filter(
            Recipe.recipe_group_id == rg.id
        ).update({"is_deleted": True}, synchronize_session=False)


def count_active_recipes_by_template(db: Session, template_group_id: int):
    return db.query(Recipe).join(
        RecipeGroup,
        Recipe.recipe_group_id == RecipeGroup.id
    ).filter(
        and_(
            RecipeGroup.template_group_id == template_group_id,
            Recipe.is_deleted == False,
            RecipeGroup.is_deleted == False
        )
    ).count()