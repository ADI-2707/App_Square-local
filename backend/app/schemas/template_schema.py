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


class TagResolveRequest(BaseModel):
    tags: List[str]


class ResolvedTagResponse(BaseModel):
    lookup_value: str
    tag_name: str


class TagSearchResponse(BaseModel):
    lookup_value: str
    tag_name: str


class TagResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DeviceResponse(BaseModel):
    id: int
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class TagResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DeviceFullResponse(BaseModel):
    id: int
    name: str
    type: str
    tags: List[TagResponse]

    model_config = ConfigDict(from_attributes=True)


class TemplateGroupResponse(BaseModel):
    id: int
    name: str
    devices: List[DeviceFullResponse] = []

    model_config = ConfigDict(from_attributes=True)
