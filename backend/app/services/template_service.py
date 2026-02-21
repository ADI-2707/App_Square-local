from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy import and_

from app.models.template_group import TemplateGroup
from app.models.device import DeviceInstance
from app.models.tag import Tag
from app.models.recipe import RecipeGroup, Recipe
from app.models.user import User
from app.services.log_service import add_log


def create_full_template_group(db: Session, data, current_user: User):

    endpoint = "/templates/full"
    method = "POST"

    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin required")

        existing = db.query(TemplateGroup).filter(
            and_(
                TemplateGroup.name == data.name,
                TemplateGroup.is_deleted == False
            )
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
                error_message="Template already exists"
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



def soft_delete_template_group(db: Session, group_id: int, current_user: User):

    endpoint = f"/templates/{group_id}"
    method = "DELETE"

    try:
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
        ).update({"is_deleted": True})

        recipe_groups = db.query(RecipeGroup).filter(
            RecipeGroup.template_group_id == group_id
        ).all()

        for rg in recipe_groups:
            rg.is_deleted = True
            db.query(Recipe).filter(
                Recipe.recipe_group_id == rg.id
            ).update({"is_deleted": True})

        db.commit()

        add_log(
            db=db,
            user=current_user,
            action=f"TEMPLATE_DELETE_{group.name.replace(' ','')}",
            status="SUCCESS",
            endpoint=endpoint,
            method=method
        )

        return {"message": "Template group deleted successfully"}

    except HTTPException as e:
        add_log(
            db=db,
            user=current_user,
            action="TEMPLATE_DELETE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type=str(e.status_code),
            error_message=e.detail
        )
        raise

    except Exception as e:
        db.rollback()
        add_log(
            db=db,
            user=current_user,
            action="TEMPLATE_DELETE",
            status="FAILURE",
            endpoint=endpoint,
            method=method,
            error_type="INTERNAL_ERROR",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal error")



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
        Tag.device_instance_id == device_id
    ).all()