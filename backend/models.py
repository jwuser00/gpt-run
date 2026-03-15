import enum
from sqlalchemy import Boolean, Column, Date, Integer, String, Float, DateTime, ForeignKey, Text, Enum, Index
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


class LLMEvaluationStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PlanStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class SessionType(str, enum.Enum):
    Easy = "Easy"
    Long = "Long"
    Interval = "Interval"
    Fast = "Fast"
    Recovery = "Recovery"
    Rest = "Rest"
    Race = "Race"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    nickname = Column(String(50), nullable=False, default="")
    google_id = Column(String(100), nullable=True, unique=True)
    birth_year = Column(Integer, nullable=True)
    birth_month = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)

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
    plans = relationship(
        "Plan",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(100), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_password_reset_tokens_token", "token", unique=True),
    )

    user = relationship("User", back_populates="password_reset_tokens")

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

    tcx_data = Column(Text, nullable=True)
    is_treadmill = Column(Boolean, default=False, nullable=False)
    llm_evaluation = Column(String(500), nullable=True)
    llm_evaluation_status = Column(Enum(LLMEvaluationStatus), nullable=True)
    plan_session_id = Column(Integer, ForeignKey("plan_sessions.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("User", back_populates="activities")
    plan_session = relationship("PlanSession", foreign_keys=[plan_session_id])


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


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    user_prompt = Column(Text, nullable=False)
    llm_plan_text = Column(Text, nullable=True)
    status = Column(Enum(PlanStatus), nullable=False, default=PlanStatus.active)
    generation_status = Column(Enum(LLMEvaluationStatus), nullable=True)

    owner = relationship("User", back_populates="plans")
    sessions = relationship(
        "PlanSession",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="PlanSession.date"
    )


class PlanSession(Base):
    __tablename__ = "plan_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    session_type = Column(Enum(SessionType), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    target_distance = Column(Float, nullable=True)  # meters
    target_pace = Column(Float, nullable=True)  # seconds per km

    plan = relationship("Plan", back_populates="sessions")
