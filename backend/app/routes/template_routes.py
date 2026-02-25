from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db, get_current_user
from app.models.device import DeviceInstance

from app.schemas.template_schema import (
    TemplateGroupFullCreate,
    TemplateGroupResponse,
    DeviceResponse,
    TagResponse
)
from app.commands.template_commands import (
    create_full_template_group,
    soft_delete_template_group
)

from app.services.template_service import (
    get_all_groups,
    get_devices_by_group,
    get_tags_by_device
)

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.post("/full", response_model=TemplateGroupResponse)
def create_full_group(
    request: Request,
    data: TemplateGroupFullCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_full_template_group(
        db=db,
        data=data,
        current_user=current_user,
        request=request
    )


@router.get("/groups", response_model=list[TemplateGroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_all_groups(db)


@router.get("/groups/{group_id}/devices", response_model=list[DeviceResponse])
def list_devices(
    group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_devices_by_group(db, group_id)


@router.get("/devices/{device_id}/tags", response_model=list[TagResponse])
def list_tags(
    device_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_tags_by_device(db, device_id)


@router.delete("/{group_id}")
def delete_template_group(
    group_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return soft_delete_template_group(
        db=db,
        group_id=group_id,
        current_user=current_user,
        request=request
    )


@router.get("/{template_group_id}/devices")
def get_template_devices(
    template_group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(DeviceInstance).filter(
        DeviceInstance.template_group_id == template_group_id,
        DeviceInstance.is_deleted == False
    ).all()