from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class TemplateChangeLog(Base):
    __tablename__ = "template_change_logs"

    id = Column(Integer, primary_key=True, index=True)

    template_group_id = Column(Integer, nullable=False, index=True)

    change_type = Column(String(50), nullable=False)

    entity_name = Column(String(150), nullable=False)

    entity_id = Column(Integer, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)