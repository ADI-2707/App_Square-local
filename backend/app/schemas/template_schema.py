from pydantic import BaseModel
from typing import List


class TagCreate(BaseModel):
    name: str


class DeviceCreate(BaseModel):
    name: str
    type: str
    tags: List[TagCreate]


class TemplateGroupCreate(BaseModel):
    name: str


class TemplateGroupResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
