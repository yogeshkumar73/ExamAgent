from fastapi import APIRouter
from app.services.gamification_service import gamification_service
from app.schemas.gamification import LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard & Competition"])


@router.get("/daily", response_model=LeaderboardResponse)
async def get_daily_leaderboard():
    """
    Returns daily leaderboard rankings with alias privacy preservation (Section 7 & 8).
    """
    return await gamification_service.get_leaderboard()
