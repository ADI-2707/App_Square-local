from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class TemplateGroup(Base):
    __tablename__ = "template_groups"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False, index=True)

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("name", name="uq_template_name"),
    )

    devices = relationship(
        "DeviceInstance",
        back_populates="group",
        cascade="all, delete"
    )

    recipe_groups = relationship(
        "RecipeGroup",
        back_populates="template_group",
        cascade="all, delete"
    )