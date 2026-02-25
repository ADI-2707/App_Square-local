from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False, index=True)

    data_type = Column(
        String(20),
        nullable=False,
        default="float",
        index=True
    )

    device_instance_id = Column(
        Integer,
        ForeignKey("device_instances.id"),
        nullable=False,
        index=True
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

    device = relationship("DeviceInstance", back_populates="tags")