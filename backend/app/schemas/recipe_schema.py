from pydantic import BaseModel, ConfigDict


class RecipeGroupCreate(BaseModel):
    name: str
    template_group_id: int


class RecipeGroupResponse(BaseModel):
    id: int
    name: str
    template_group_id: int

    model_config = ConfigDict(from_attributes=True)


class RecipeCreate(BaseModel):
    name: str
    recipe_group_id: int


class RecipeResponse(BaseModel):
    id: int
    name: str
    recipe_group_id: int

    model_config = ConfigDict(from_attributes=True)


class AddDeviceToRecipe(BaseModel):
    device_instance_id: int
