from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(
        String(128),
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False
    )

    failed_attempts = Column(
        Integer,
        default=0,
        nullable=False
    )

    blocked_until = Column(
        DateTime,
        nullable=True
    )

    token_version = Column(
        Integer,
        default=0,
        nullable=False
    )