from fastapi import APIRouter, Depends
from app.services.evaluation_service import evaluation_service
from app.services.analytics_service import analytics_service
from app.database.repositories.session_repository import session_repo
from app.core.security import get_current_user_optional
from app.core.exceptions import ResourceNotFoundException
from app.schemas.sessions import (
    StartSessionRequest,
    SubmitAnswerRequest,
    SessionResultResponse,
    SessionAttemptItem
)
from app.schemas.evaluation import EvaluationResponse, EvaluationData

router = APIRouter(prefix="/sessions", tags=["Practice Sessions & Evaluation"])


@router.post("/start")
async def start_session(
    payload: StartSessionRequest,
    current_user: dict = Depends(get_current_user_optional)
):
    """Starts a new practice session for an authenticated or anonymous learner."""
    anonymous_id = payload.anonymous_id or current_user.get("id", "guest")
    session = await session_repo.create_session(
        anonymous_id=anonymous_id,
        content_id=payload.content_id,
        total_questions=payload.total_questions,
        difficulty=payload.difficulty
    )
    return {
        "success": True,
        "session_id": session["_id"],
        "anonymous_id": session["anonymous_id"],
        "total_questions": session["total_questions"],
        "difficulty": session["difficulty"],
        "status": session["status"]
    }


@router.post("/{session_id}/submit", response_model=EvaluationResponse)
async def submit_answer(
    session_id: str,
    payload: SubmitAnswerRequest
):
    """
    Submits user answer for semantic AI evaluation against rubric,
    awards XP idempotently, updates BKT mastery, and provides constructive feedback.
    """
    result = await evaluation_service.evaluate_submission(
        session_id=session_id,
        question_id=payload.question_id,
        user_answer=payload.user_answer,
        response_time_ms=payload.response_time_ms
    )
    return EvaluationResponse(
        success=True,
        data=EvaluationData(**result)
    )


@router.get("/{session_id}/result", response_model=SessionResultResponse)
async def get_session_result(session_id: str):
    """Returns the cumulative score, accuracy, attempts, and XP for a finished session."""
    session = await session_repo.get_session(session_id)
    if not session:
        raise ResourceNotFoundException("Session", session_id)

    analytics = await analytics_service.get_session_analytics(session_id)
    raw_attempts = analytics.get("attempts", [])
    attempt_items = []
    for a in raw_attempts:
        attempt_items.append(SessionAttemptItem(
            id=a["_id"],
            question_id=a["question_id"],
            question_text=a.get("question_text", ""),
            topic=a.get("topic", "General"),
            difficulty=a.get("difficulty", "medium"),
            user_answer=a.get("user_answer", ""),
            score=a.get("score", 0.0),
            rating=a.get("rating", "Good"),
            missing_concepts=a.get("missing_concepts", []),
            confidence=a.get("confidence", 0.9),
            response_time_ms=a.get("response_time_ms", 0),
            xp_earned=a.get("xp_earned", 0),
            created_at=a.get("created_at", "")
        ))

    return SessionResultResponse(
        session_id=session["_id"],
        anonymous_id=session["anonymous_id"],
        content_id=session.get("content_id"),
        total_questions=session.get("total_questions", len(raw_attempts)),
        completed_questions=len(raw_attempts),
        accuracy=analytics.get("accuracy", 0.0),
        average_score=analytics.get("average_score", 0.0),
        total_xp=session.get("total_xp", 0),
        status=session.get("status", "completed"),
        created_at=session.get("created_at", ""),
        attempts=attempt_items
    )
