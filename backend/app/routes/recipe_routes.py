from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.schemas.recipe_schema import (
    RecipeGroupCreate,
    RecipeGroupResponse,
    RecipeCreate,
    RecipeResponse
)
from app.services.recipe_service import (
    create_recipe_group,
    create_recipe
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
