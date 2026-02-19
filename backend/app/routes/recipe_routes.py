from fastapi import APIRouter, Depends, Query
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
    create_recipe,
    get_recipe_groups_by_template,
    get_recipes_by_group,
    get_full_recipe
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


@router.get("/groups/{template_group_id}", response_model=list[RecipeGroupResponse])
def list_recipe_groups(
    template_group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_recipe_groups_by_template(db, template_group_id)


@router.get("/group/{recipe_group_id}", response_model=list[RecipeResponse])
def list_recipes(
    recipe_group_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    offset = (page - 1) * limit
    recipes = get_recipes_by_group(db, recipe_group_id)
    return recipes[offset: offset + limit]


@router.get("/{recipe_id}/full")
def get_full_recipe_route(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_full_recipe(db, recipe_id)
