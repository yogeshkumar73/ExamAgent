from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


QuestionDifficulty = Literal["easy", "medium", "hard", "expert"]
QuestionType = Literal["descriptive", "mcq", "technical", "scenario", "hr"]


class QuestionGenerateRequest(BaseModel):
    content_id: Optional[str] = None
    topics: Optional[List[str]] = Field(default_factory=list)
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: QuestionDifficulty = "medium"
    question_types: List[QuestionType] = Field(default=["descriptive", "mcq", "technical"])
    adaptive_mode: bool = True
    context_text: Optional[str] = None


class QuestionItem(BaseModel):
    id: str
    content_id: Optional[str] = None
    topic: str
    difficulty: QuestionDifficulty
    type: QuestionType
    question: str
    options: Optional[List[str]] = None
    reference_answer: str
    rubric: Dict[str, Any] = Field(default_factory=dict)
    hint: Optional[str] = None


class QuestionListResponse(BaseModel):
    success: bool = True
    count: int
    data: List[QuestionItem]
