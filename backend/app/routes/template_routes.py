from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.schemas.template_schema import (
    TemplateGroupCreate,
    DeviceCreate,
    TemplateGroupResponse
)
from app.services.template_service import (
    create_template_group,
    create_device,
    get_all_groups
)

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.post("/groups", response_model=TemplateGroupResponse)
def create_group(
    data: TemplateGroupCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return create_template_group(db, data.name, current_user.id)


@router.get("/groups", response_model=list[TemplateGroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_all_groups(db)


@router.post("/groups/{group_id}/devices")
def create_device_route(
    group_id: int,
    data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return create_device(db, group_id, data, current_user.id)
