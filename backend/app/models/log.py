from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base


class Log(Base): 
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(5), nullable=False)
    action = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    endpoint = Column(String(200), nullable=True)
    method = Column(String(10), nullable=True)
    error_type = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)