from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.schemas.evaluation import EvaluationData


class StartSessionRequest(BaseModel):
    content_id: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    difficulty: str = "medium"
    total_questions: int = Field(default=5, ge=1, le=20)
    anonymous_id: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    user_answer: str = Field(..., min_length=1)
    response_time_ms: int = Field(default=0, ge=0)


class SessionAttemptItem(BaseModel):
    id: str
    question_id: str
    question_text: str
    topic: str
    difficulty: str
    user_answer: str
    score: float
    rating: str
    missing_concepts: List[str]
    confidence: float
    response_time_ms: int
    xp_earned: int
    created_at: str


class SessionResultResponse(BaseModel):
    session_id: str
    anonymous_id: str
    content_id: Optional[str] = None
    total_questions: int
    completed_questions: int
    accuracy: float
    average_score: float
    total_xp: int
    status: str
    created_at: str
    completed_at: Optional[str] = None
    attempts: List[SessionAttemptItem] = Field(default_factory=list)
