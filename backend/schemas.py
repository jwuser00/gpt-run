from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime
from enum import Enum


class LLMEvaluationStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ComputedLap(BaseModel):
    lap_number: int
    distance: float
    time: float
    pace: float
    avg_hr: float | None = None
    max_hr: float | None = None
    avg_cadence: float | None = None


class ActivityBase(BaseModel):
    start_time: datetime
    total_distance: float
    total_time: float
    avg_pace: float
    avg_hr: float | None = None
    avg_cadence: float | None = None


class ActivityCreate(ActivityBase):
    pass


class Activity(ActivityBase):
    id: int
    user_id: int
    is_treadmill: bool = False
    llm_evaluation: str | None = None
    llm_evaluation_status: LLMEvaluationStatus | None = None
    plan_session_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ActivityDetail(Activity):
    laps: list[ComputedLap] = []


class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    nickname: str
    birth_year: int
    birth_month: int
    gender: str

class User(UserBase):
    id: int
    nickname: str
    birth_year: int | None = None
    birth_month: int | None = None
    gender: str | None = None
    has_password: bool = False
    activities: List[Activity] = []

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    nickname: str
    birth_year: int
    birth_month: int
    gender: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class UserProfile(BaseModel):
    email: str
    nickname: str
    birth_year: int | None = None
    birth_month: int | None = None
    gender: str | None = None
    has_google: bool
    has_password: bool

    model_config = ConfigDict(from_attributes=True)


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None


# --- Race schemas ---

class DistanceType(str, Enum):
    full = "full"
    half = "half"
    ten_km = "10km"
    five_km = "5km"
    custom = "custom"

class RaceStatus(str, Enum):
    upcoming = "예정"
    finished = "완주"
    dns = "DNS"
    dnf = "DNF"

class RaceImageOut(BaseModel):
    id: int
    race_id: int
    filename: str
    original_name: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RaceBase(BaseModel):
    race_name: str
    race_date: datetime
    location: str | None = None
    distance_type: DistanceType
    distance_custom: float | None = None
    target_time: float | None = None
    actual_time: float | None = None
    status: RaceStatus = RaceStatus.upcoming
    activity_id: int | None = None
    review: str | None = None

# Registration: only basic info
class RaceCreate(BaseModel):
    race_name: str
    race_date: datetime
    location: str | None = None
    distance_type: DistanceType
    distance_custom: float | None = None
    target_time: float | None = None

# Edit basic info
class RaceUpdate(BaseModel):
    race_name: str | None = None
    race_date: datetime | None = None
    location: str | None = None
    distance_type: DistanceType | None = None
    distance_custom: float | None = None
    target_time: float | None = None

# Result update: status, actual_time, review, activity_id
class RaceResultUpdate(BaseModel):
    status: RaceStatus | None = None
    actual_time: float | None = None
    activity_id: int | None = None
    review: str | None = None

class ActivityBrief(BaseModel):
    id: int
    start_time: datetime
    total_distance: float
    total_time: float
    avg_pace: float

    model_config = ConfigDict(from_attributes=True)

class RaceOut(RaceBase):
    id: int
    user_id: int
    images: List[RaceImageOut] = []
    activity: ActivityBrief | None = None

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard schemas ---

class MonthlyRunningDay(BaseModel):
    date: str  # YYYY-MM-DD
    distance_km: float
    avg_pace: float | None = None  # seconds per km

class RecentActivity(BaseModel):
    id: int
    start_time: datetime
    total_distance: float
    total_time: float
    avg_pace: float
    avg_hr: float | None = None

    model_config = ConfigDict(from_attributes=True)

class DashboardData(BaseModel):
    upcoming_races: List[RaceOut] = []
    monthly_running: List[MonthlyRunningDay] = []
    recent_activities: List[RecentActivity] = []


# --- Plan schemas ---

class PlanStatus(str, Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class SessionType(str, Enum):
    Easy = "Easy"
    Long = "Long"
    Interval = "Interval"
    Fast = "Fast"
    Recovery = "Recovery"
    Rest = "Rest"
    Race = "Race"


class PlanCreate(BaseModel):
    user_prompt: str


class PlanSessionOut(BaseModel):
    id: int
    plan_id: int
    date: date
    session_type: SessionType
    title: str
    description: str | None = None
    target_distance: float | None = None
    target_pace: float | None = None

    model_config = ConfigDict(from_attributes=True)


class PlanSessionBrief(BaseModel):
    id: int
    date: date
    session_type: SessionType
    title: str

    model_config = ConfigDict(from_attributes=True)


class PlanOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    start_date: date | None = None
    end_date: date | None = None
    user_prompt: str
    llm_plan_text: str | None = None
    status: PlanStatus
    generation_status: LLMEvaluationStatus | None = None
    session_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PlanDetail(PlanOut):
    sessions: list[PlanSessionOut] = []
