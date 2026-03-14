from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum


class LapBase(BaseModel):
    lap_number: int
    distance: float
    time: float
    pace: float
    avg_hr: Optional[float] = None
    max_hr: Optional[float] = None
    avg_cadence: Optional[float] = None

class Lap(LapBase):
    id: int
    activity_id: int

    class Config:
        from_attributes = True

class ActivityBase(BaseModel):
    start_time: datetime
    total_distance: float
    total_time: float
    avg_pace: float
    avg_hr: Optional[float] = None
    avg_cadence: Optional[float] = None

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: int
    user_id: int
    laps: List[Lap] = []

    class Config:
        from_attributes = True

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
    birth_year: Optional[int] = None
    birth_month: Optional[int] = None
    gender: Optional[str] = None
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
    birth_year: Optional[int] = None
    birth_month: Optional[int] = None
    gender: Optional[str] = None
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
    email: Optional[str] = None


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

    class Config:
        from_attributes = True

class RaceBase(BaseModel):
    race_name: str
    race_date: datetime
    location: Optional[str] = None
    distance_type: DistanceType
    distance_custom: Optional[float] = None
    target_time: Optional[float] = None
    actual_time: Optional[float] = None
    status: RaceStatus = RaceStatus.upcoming
    activity_id: Optional[int] = None
    review: Optional[str] = None

# Registration: only basic info
class RaceCreate(BaseModel):
    race_name: str
    race_date: datetime
    location: Optional[str] = None
    distance_type: DistanceType
    distance_custom: Optional[float] = None
    target_time: Optional[float] = None

# Edit basic info
class RaceUpdate(BaseModel):
    race_name: Optional[str] = None
    race_date: Optional[datetime] = None
    location: Optional[str] = None
    distance_type: Optional[DistanceType] = None
    distance_custom: Optional[float] = None
    target_time: Optional[float] = None

# Result update: status, actual_time, review, activity_id
class RaceResultUpdate(BaseModel):
    status: Optional[RaceStatus] = None
    actual_time: Optional[float] = None
    activity_id: Optional[int] = None
    review: Optional[str] = None

class ActivityBrief(BaseModel):
    id: int
    start_time: datetime
    total_distance: float
    total_time: float
    avg_pace: float

    class Config:
        from_attributes = True

class RaceOut(RaceBase):
    id: int
    user_id: int
    images: List[RaceImageOut] = []
    activity: Optional[ActivityBrief] = None

    class Config:
        from_attributes = True


# --- Dashboard schemas ---

class MonthlyRunningDay(BaseModel):
    date: str  # YYYY-MM-DD
    distance_km: float
    avg_pace: Optional[float] = None  # seconds per km

class RecentActivity(BaseModel):
    id: int
    start_time: datetime
    total_distance: float
    total_time: float
    avg_pace: float
    avg_hr: Optional[float] = None

    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    upcoming_races: List[RaceOut] = []
    monthly_running: List[MonthlyRunningDay] = []
    recent_activities: List[RecentActivity] = []
