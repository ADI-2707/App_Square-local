from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Text,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class RecipeGroup(Base):
    __tablename__ = "recipe_groups"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    template_group_id = Column(
        Integer,
        ForeignKey("template_groups.id"),
        nullable=False,
        index=True
    )

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

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "template_group_id",
            "name",
            name="uq_recipe_group_template_name"
        ),
    )

    recipes = relationship(
        "Recipe",
        back_populates="recipe_group",
        cascade="all, delete"
    )


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    recipe_group_id = Column(
        Integer,
        ForeignKey("recipe_groups.id"),
        nullable=False,
        index=True
    )

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

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "recipe_group_id",
            "name",
            name="uq_recipe_name_per_group"
        ),
    )

    recipe_group = relationship(
        "RecipeGroup",
        back_populates="recipes"
    )

    devices = relationship(
        "RecipeDevice",
        back_populates="recipe",
        cascade="all, delete"
    )


class RecipeDevice(Base):
    __tablename__ = "recipe_devices"

    id = Column(Integer, primary_key=True, index=True)

    recipe_id = Column(
        Integer,
        ForeignKey("recipes.id"),
        nullable=False,
        index=True
    )

    device_instance_id = Column(
        Integer,
        ForeignKey("device_instances.id"),
        nullable=False,
        index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "recipe_id",
            "device_instance_id",
            name="uq_recipe_device_unique"
        ),
    )

    recipe = relationship(
        "Recipe",
        back_populates="devices"
    )

    tag_values = relationship(
        "RecipeTagValue",
        back_populates="recipe_device",
        cascade="all, delete"
    )


class RecipeTagValue(Base):
    __tablename__ = "recipe_tag_values"

    id = Column(Integer, primary_key=True, index=True)

    recipe_device_id = Column(
        Integer,
        ForeignKey("recipe_devices.id"),
        nullable=False,
        index=True
    )

    tag_id = Column(
        Integer,
        ForeignKey("tags.id"),
        nullable=False,
        index=True
    )

    value = Column(
        Text,
        nullable=False,
        default="0"
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "recipe_device_id",
            "tag_id",
            name="uq_recipe_tag_value_unique"
        ),
    )

    recipe_device = relationship(
        "RecipeDevice",
        back_populates="tag_values"
    )
