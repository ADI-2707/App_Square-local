from pydantic import BaseModel, ConfigDict
from typing import List

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


class TagValueResponse(BaseModel):
    id: int
    tag_name: str
    value: str

    model_config = ConfigDict(from_attributes=True)


class RecipeDeviceResponse(BaseModel):
    id: int
    device_name: str
    tag_values: List[TagValueResponse]

    model_config = ConfigDict(from_attributes=True)


class FullRecipeResponse(BaseModel):
    id: int
    name: str
    devices: List[RecipeDeviceResponse]

    model_config = ConfigDict(from_attributes=True)