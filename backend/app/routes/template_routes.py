from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.schemas.template_schema import (
    TemplateGroupFullCreate,
    TemplateGroupResponse
)
from app.services.template_service import (
    create_full_template_group,
    get_all_groups_with_hierarchy
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
    return get_all_groups_with_hierarchy(db)
