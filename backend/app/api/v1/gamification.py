from fastapi import APIRouter, Depends, Request
from typing import List, Optional
from app.services.gamification_service import gamification_service
from app.core.security import get_current_user_optional
from app.schemas.gamification import (
    GamificationProfileResponse,
    DailyQuestSchema,
    ClaimQuestResponse
)

router = APIRouter(prefix="/gamification", tags=["Gamification Engine"])


@router.get("/quests", response_model=List[DailyQuestSchema])
async def get_daily_quests(
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """Returns today's daily quest objectives and progress."""
    user_id = current_user.get("id", "guest")
    return await gamification_service.get_quests(user_id)


@router.post("/quests/{quest_id}/claim", response_model=ClaimQuestResponse)
async def claim_quest_reward(
    quest_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Claims XP reward for a completed daily quest with server-side idempotency
    to prevent duplicate claims (Section 7).
    """
    user_id = current_user.get("id", "guest")
    return await gamification_service.claim_quest(user_id, quest_id)


@router.get("/{identifier}", response_model=GamificationProfileResponse)
async def get_gamification_profile(identifier: str):
    """Retrieves XP, Level, Rank, Badges, and Streaks for the user."""
    return await gamification_service.get_profile(identifier)
