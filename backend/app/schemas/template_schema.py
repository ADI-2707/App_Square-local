from pydantic import BaseModel, ConfigDict
from typing import List


class TagCreate(BaseModel):
    name: str


class DeviceCreate(BaseModel):
    name: str
    type: str
    tags: List[TagCreate]


class TemplateGroupFullCreate(BaseModel):
    name: str
    devices: List[DeviceCreate]


class TagResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DeviceResponse(BaseModel):
    id: int
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class TemplateGroupResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
