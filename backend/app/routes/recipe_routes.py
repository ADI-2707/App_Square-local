from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List

from app.utils.dependencies import get_db, get_current_user
from app.schemas.recipe_schema import (
    RecipeGroupCreate,
    RecipeGroupResponse,
    RecipeCreate,
    RecipeResponse,
    FullRecipeResponse
)

from app.commands.recipe_commands import (
    create_recipe_group,
    create_recipe,
    delete_recipe_command,
    delete_recipe_group_command,
    update_recipe_values
)

from app.queries.recipe_queries import (
    get_recipe_groups_by_template,
    get_recipes_by_group_paginated,
    get_full_recipe,
    get_recipes_global
)

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.post("/groups", response_model=RecipeGroupResponse)
def create_group(
    request: Request,
    data: RecipeGroupCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_recipe_group(
        db=db,
        name=data.name,
        template_group_id=data.template_group_id,
        current_user=current_user,
        request=request
    )


@router.get(
    "/groups/{template_group_id}",
    response_model=List[RecipeGroupResponse]
)
def list_recipe_groups(
    template_group_id: int,
    search: str = Query(default=""),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_recipe_groups_by_template(
        db=db,
        template_group_id=template_group_id,
        search=search
    )


@router.post("", response_model=RecipeResponse)
def create_recipe_route(
    request: Request,
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_recipe(
        db=db,
        name=data.name,
        recipe_group_id=data.recipe_group_id,
        selected_device_ids=data.selected_device_ids,
        current_user=current_user,
        request=request
    )


@router.get(
    "/group/{recipe_group_id}",
    response_model=List[RecipeResponse]
)
def list_recipes(
    recipe_group_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_recipes_by_group_paginated(
        db=db,
        recipe_group_id=recipe_group_id,
        page=page,
        limit=limit
    )


@router.get("/{recipe_id}/full", response_model=FullRecipeResponse)
def get_full_recipe_route(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_full_recipe(
        db=db,
        recipe_id=recipe_id
    )


@router.delete("/{recipe_id}")
def delete_recipe_route(
    request: Request,
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return delete_recipe_command(
        db=db,
        recipe_id=recipe_id,
        current_user=current_user,
        request=request
    )


@router.delete("/groups/{recipe_group_id}")
def delete_recipe_group_route(
    request: Request,
    recipe_group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return delete_recipe_group_command(
        db=db,
        recipe_group_id=recipe_group_id,
        current_user=current_user,
        request=request
    )


@router.put("/{recipe_id}/values")
def update_recipe_values_route(
    recipe_id: int,
    request: Request,
    data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return update_recipe_values(
        db=db,
        recipe_id=recipe_id,
        changes=data.get("changes", []),
        current_user=current_user,
        request=request
    )


@router.get("")
def get_all_recipes(
    search: str = "",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    skip = (page - 1) * limit

    results, total = get_recipes_global(
        db=db,
        search=search,
        skip=skip,
        limit=limit
    )

    data = []

    for recipe in results:
        template_name = "Unknown"

        if hasattr(recipe, "recipe_group") and recipe.recipe_group:
            if hasattr(recipe.recipe_group, "template_group") and recipe.recipe_group.template_group:
                template_name = recipe.recipe_group.template_group.name

        data.append({
            "id": recipe.id,
            "name": recipe.name,
            "template_name": template_name,
            "recipe_group_id": recipe.recipe_group_id,
            "area_name": recipe.recipe_group.name if recipe.recipe_group else None
        })

    return {
        "data": data,
        "total": total
    }