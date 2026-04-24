from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db, get_current_user
from app.models.device import DeviceInstance

from app.schemas.template_schema import (
    TemplateGroupFullCreate,
    TemplateGroupResponse,
    DeviceResponse,
    TagResponse,
    TagResolveRequest,
    ResolvedTagResponse,
)
from app.commands.template_commands import (
    create_full_template_group,
    delete_device_from_template,
    delete_template_group as delete_template_group_command,
    delete_tag_from_device
)

from app.services.template_service import (
    get_all_groups,
    get_devices_by_group,
    get_tags_by_device,
    get_full_template,
    get_device_full,
    get_templates_advanced,
    get_resolved_tags,
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


@router.post("/tags/resolve", response_model=list[ResolvedTagResponse])
def resolve_template_tags(
    data: TagResolveRequest,
    current_user = Depends(get_current_user),
):
    return get_resolved_tags(data.tags)


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


@router.get("/devices/{device_id}/full")
def get_device_full_route(
    device_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    device = get_device_full(db, device_id)

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    return device


@router.delete("/{group_id}")
def delete_template_group(
    group_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return delete_template_group_command(
        db=db,
        group_id=group_id,
        current_user=current_user,
        request=request
    )



@router.get("/{template_group_id}/full")
def get_full_template_route(
    template_group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    template = get_full_template(db, template_group_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    return template


@router.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return delete_device_from_template(
        db=db,
        device_id=device_id,
        current_user=current_user,
        request=request
    )


@router.get("")
def get_templates(
    search: str = Query("", description="Search template name"),
    sort: str = Query("newest"),
    date_filter: str = Query("all"),
    page: int = Query(1, ge=1),
    limit: int = Query(8, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_templates_advanced(
        db=db,
        search=search,
        sort=sort,
        date_filter=date_filter,
        page=page,
        limit=limit
    )


@router.delete("/tags/{tag_id}")
def delete_tag(
    tag_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return delete_tag_from_device(
        db=db,
        tag_id=tag_id,
        current_user=current_user,
        request=request
    )
