from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)

    actor = Column(
        String(1),
        nullable=False
    )

    action = Column(
        String(50),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
