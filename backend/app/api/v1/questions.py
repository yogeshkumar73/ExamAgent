from fastapi import APIRouter
from app.services.question_service import question_service
from app.schemas.questions import (
    QuestionGenerateRequest,
    QuestionItem,
    QuestionListResponse
)

router = APIRouter(prefix="/questions", tags=["Question Generator"])


@router.post("/generate", response_model=QuestionListResponse)
async def generate_questions(payload: QuestionGenerateRequest):
    """
    Generates grounded interview questions by type, topic, and difficulty with answer keys & rubrics.
    """
    questions = await question_service.generate_questions(
        content_id=payload.content_id,
        topics=payload.topics,
        question_count=payload.question_count,
        difficulty=payload.difficulty,
        question_types=payload.question_types,
        context_text=payload.context_text
    )
    items = [QuestionItem(**q) for q in questions]
    return QuestionListResponse(
        success=True,
        count=len(items),
        data=items
    )


@router.get("/{question_id}", response_model=QuestionItem)
async def get_question_details(question_id: str):
    """Retrieves full question details, reference answer, rubric, and hints."""
    q = await question_service.get_question(question_id)
    return QuestionItem(**q)
