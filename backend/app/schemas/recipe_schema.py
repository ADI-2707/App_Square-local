from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

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
    selected_device_ids: List[int]


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
    value: float

    model_config = ConfigDict(from_attributes=True)


class RecipeDeviceResponse(BaseModel):
    id: int
    device_name: str
    tag_values: List[TagValueResponse]

    model_config = ConfigDict(from_attributes=True)
    

class ChangeLog(BaseModel):
    type: str
    name: str
    timestamp: str


class FullRecipeResponse(BaseModel):
    id: int
    name: str
    template_group_id: int
    devices: List[RecipeDeviceResponse]
    removed_devices: Optional[List[str]] = []
    changes: Optional[List[ChangeLog]] = []
    
    model_config = ConfigDict(from_attributes=True)