import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from database import Base


class DistanceType(str, enum.Enum):
    full = "full"
    half = "half"
    ten_km = "10km"
    five_km = "5km"
    custom = "custom"


class RaceStatus(str, enum.Enum):
    upcoming = "예정"
    finished = "완주"
    dns = "DNS"
    dnf = "DNF"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))

    activities = relationship(
        "Activity",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    races = relationship(
        "Race",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    start_time = Column(DateTime)
    total_distance = Column(Float) # meters
    total_time = Column(Float) # seconds
    avg_pace = Column(Float) # seconds per km
    avg_hr = Column(Float)
    avg_cadence = Column(Float)

    owner = relationship("User", back_populates="activities")
    laps = relationship(
        "Lap",
        back_populates="activity",
        cascade="all, delete-orphan"
    )

class Lap(Base):
    __tablename__ = "laps"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"))
    lap_number = Column(Integer)
    distance = Column(Float) # meters
    time = Column(Float) # seconds
    pace = Column(Float) # seconds per km
    avg_hr = Column(Float)
    max_hr = Column(Float)
    avg_cadence = Column(Float)

    activity = relationship("Activity", back_populates="laps")


class Race(Base):
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    race_name = Column(String(200), nullable=False)
    race_date = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    distance_type = Column(Enum(DistanceType), nullable=False)
    distance_custom = Column(Float, nullable=True)  # meters, for custom distance
    target_time = Column(Float, nullable=True)  # seconds
    actual_time = Column(Float, nullable=True)  # seconds, actual finish time
    status = Column(Enum(RaceStatus), nullable=False, default=RaceStatus.upcoming)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    review = Column(Text, nullable=True)

    owner = relationship("User", back_populates="races")
    activity = relationship("Activity", foreign_keys=[activity_id])
    images = relationship(
        "RaceImage",
        back_populates="race",
        cascade="all, delete-orphan"
    )


class RaceImage(Base):
    __tablename__ = "race_images"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"))
    filename = Column(String(255), nullable=False)  # UUID-based filename
    original_name = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, nullable=False)

    race = relationship("Race", back_populates="images")
