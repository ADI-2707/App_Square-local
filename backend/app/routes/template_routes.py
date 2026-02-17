from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.schemas.template_schema import (
    TemplateGroupFullCreate,
    TemplateGroupResponse,
    DeviceResponse,
    TagResponse
)
from app.services.template_service import (
    create_full_template_group,
    get_all_groups,
    get_devices_by_group,
    get_tags_by_device
)

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.post("/full", response_model=TemplateGroupResponse)
def create_full_group(
    data: TemplateGroupFullCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return create_full_template_group(db, data, current_user.id)


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