from typing import List, Optional
from pydantic import BaseModel, Field


class BadgeSchema(BaseModel):
    id: str
    name: str
    condition: str
    icon: str
    unlocked_at: Optional[str] = None
    is_unlocked: bool = False


class DailyQuestSchema(BaseModel):
    quest_id: str
    title: str
    description: str
    reward_xp: int
    progress: int
    target: int
    is_completed: bool
    is_claimed: bool


class GamificationProfileResponse(BaseModel):
    anonymous_id: str
    xp: int
    level: int
    rank: str  # Beginner, Intermediate, Advanced, Master
    streak_days: int
    badges: List[BadgeSchema]
    completed_quests: List[str]
    next_level_xp: int
    level_progress_percent: float


class ClaimQuestRequest(BaseModel):
    idempotency_key: Optional[str] = None


class ClaimQuestResponse(BaseModel):
    success: bool
    quest_id: str
    reward_xp: int
    new_total_xp: int
    new_level: int
    message: str


class LeaderboardEntrySchema(BaseModel):
    rank: int
    anonymous_alias: str
    points: int
    badge_count: int
    level: int


class LeaderboardResponse(BaseModel):
    period: str = "daily"
    count: int
    data: List[LeaderboardEntrySchema]
