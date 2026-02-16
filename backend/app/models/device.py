from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DeviceInstance(Base):
    __tablename__ = "device_instances"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False, index=True)

    type = Column(String(100), nullable=False, index=True)

    template_group_id = Column(
        Integer,
        ForeignKey("template_groups.id"),
        nullable=False,
        index=True
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    group = relationship("TemplateGroup", back_populates="devices")

    tags = relationship("Tag", back_populates="device", cascade="all, delete")
