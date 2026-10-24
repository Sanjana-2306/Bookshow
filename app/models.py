from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database import Base


class TrafficRecord(Base):
    __tablename__ = "traffic_records"

    id = Column(Integer, primary_key=True, autoincrement=True)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    active_users = Column(Integer, default=0)
    requests_per_minute = Column(Integer, default=0)
    successful_bookings = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)

    average_response_time = Column(Float, default=0)
    cpu_usage = Column(Float, default=0)
    memory_usage = Column(Float, default=0)

    traffic_score = Column(Float, default=0)
    traffic_level = Column(String(20))