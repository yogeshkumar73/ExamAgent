from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field


EvaluationRating = Literal["Excellent", "Good", "Needs Improvement", "Weak"]


class CriterionBreakdown(BaseModel):
    conceptual_correctness: float = Field(..., ge=0, le=40, description="40% weight")
    key_concept_coverage: float = Field(..., ge=0, le=25, description="25% weight")
    explanation_quality: float = Field(..., ge=0, le=15, description="15% weight")
    practical_application: float = Field(..., ge=0, le=10, description="10% weight")
    clarity_and_structure: float = Field(..., ge=0, le=10, description="10% weight")


class EvaluationData(BaseModel):
    score: float = Field(..., ge=0, le=100)
    rating: EvaluationRating
    correct_answer: str
    missing_concepts: List[str] = Field(default_factory=list)
    correct_concepts: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.92, ge=0.0, le=1.0)
    xp_earned: int = 0
    next_difficulty: str = "medium"
    criterion_breakdown: Optional[CriterionBreakdown] = None
    follow_up_question: Optional[str] = None


class EvaluationResponse(BaseModel):
    success: bool = True
    data: EvaluationData
    source: str = "ai_evaluator"
