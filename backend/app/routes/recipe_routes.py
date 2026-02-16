from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.schemas.recipe_schema import (
    RecipeGroupCreate,
    RecipeGroupResponse,
    RecipeCreate,
    RecipeResponse,
    AddDeviceToRecipe
)
from app.services.recipe_service import (
    create_recipe_group,
    create_recipe,
    add_device_to_recipe
)

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.post("/groups", response_model=RecipeGroupResponse)
def create_group(
    data: RecipeGroupCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_recipe_group(
        db,
        data.name,
        data.template_group_id,
        current_user.id
    )


@router.post("", response_model=RecipeResponse)
def create_recipe_route(
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_recipe(
        db,
        data.name,
        data.recipe_group_id,
        current_user.id
    )


@router.post("/{recipe_id}/devices")
def add_device(
    recipe_id: int,
    data: AddDeviceToRecipe,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return add_device_to_recipe(
        db,
        recipe_id,
        data.device_instance_id
    )
