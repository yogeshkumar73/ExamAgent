from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class TopicMasterySchema(BaseModel):
    topic: str
    mastery_estimate: float
    accuracy: float
    attempts_count: int
    bkt_p_known: float
    status: str  # Weak, Developing, Mastered


class WeakTopicItem(BaseModel):
    topic: str
    accuracy: float
    attempts: int
    mastery_estimate: float
    primary_missing_concepts: List[str]
    suggested_revision_interval_hours: int


class RecommendationItem(BaseModel):
    title: str
    topic: str
    recommended_difficulty: str
    reason: str
    target_concepts: List[str]
    action_type: str  # practice_session, concept_revision, mock_challenge


class AnalyticsSummaryResponse(BaseModel):
    session_id: Optional[str] = None
    user_or_anon_id: str
    total_attempts: int
    overall_accuracy: float
    average_response_time_ms: int
    topic_breakdown: List[TopicMasterySchema]
    recent_trend: List[Dict[str, Any]]
    weak_topics: List[WeakTopicItem]
    recommendations: List[RecommendationItem]
