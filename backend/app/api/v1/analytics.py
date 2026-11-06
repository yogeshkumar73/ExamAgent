from fastapi import APIRouter
from typing import List
from app.services.analytics_service import analytics_service
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    WeakTopicItem,
    RecommendationItem
)

router = APIRouter(prefix="/analytics", tags=["Performance Analytics & ML"])


@router.get("/{identifier}/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(identifier: str):
    """Returns overall user progress, mastery estimates, accuracy, and score trends."""
    return await analytics_service.get_user_analytics_summary(identifier)


@router.get("/{identifier}/weak-topics", response_model=List[WeakTopicItem])
async def get_weak_topics(identifier: str):
    """Computes topics with lowest mastery and frequent conceptual gaps."""
    summary = await analytics_service.get_user_analytics_summary(identifier)
    return summary.weak_topics


@router.get("/{identifier}/recommendations", response_model=List[RecommendationItem])
async def get_recommendations(identifier: str):
    """Returns adaptive learning suggestions based on candidate performance."""
    summary = await analytics_service.get_user_analytics_summary(identifier)
    return summary.recommendations


@router.get("/session/{session_id}")
async def get_session_analytics(session_id: str):
    """Returns analytics specific to a completed session."""
    return await analytics_service.get_session_analytics(session_id)
