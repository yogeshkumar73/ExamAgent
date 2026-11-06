import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Body
from pydantic import BaseModel, Field
from app.ai.evaluator import answer_evaluator, calculate_deterministic_evaluation
from app.ai.generator import question_generator, CURATED_QUESTION_BANK
from app.ai.provider import ai_provider

router = APIRouter(prefix="/interviewer", tags=["Interviewer Bridge"])


class EvaluateCandidateRequest(BaseModel):
    question: str
    category: Optional[str] = "Technical"
    difficulty: Optional[str] = "Hard"
    topic: Optional[str] = "System Design"
    referenceAnswer: Optional[str] = ""
    rubricCriteria: Optional[List[str]] = Field(default_factory=list)
    userAnswer: str
    sourceContext: Optional[str] = None


class GenerateQuestionBridgeRequest(BaseModel):
    topic: Optional[str] = "FastAPI & Redis Caching"
    category: Optional[str] = "Technical"
    difficulty: Optional[str] = "Hard"
    customDocumentText: Optional[str] = None


@router.post("/evaluate")
async def evaluate_interviewer_response(payload: EvaluateCandidateRequest):
    """
    Evaluates candidate response matching the frontend AI interviewer contract,
    grounded in the 5-part rubric (Conceptual correctness 40%, Coverage 25%, Quality 15%, Practical 10%, Clarity 10%).
    """
    eval_res = await answer_evaluator.evaluate_answer(
        question=payload.question,
        reference_answer=payload.referenceAnswer or "Candidate should explain architecture, core principles and trade-offs.",
        user_answer=payload.userAnswer,
        rubric_concepts=payload.rubricCriteria or ["Core Concepts", "Implementation", "Trade-offs"],
        source_context=payload.sourceContext,
        difficulty=payload.difficulty or "Hard"
    )

    cb = eval_res.get("criterion_breakdown", {})
    return {
        "success": True,
        "data": {
            "score": eval_res.get("score", 80),
            "rating": eval_res.get("rating", "Good"),
            "criterionBreakdown": {
                "conceptualCorrectness": cb.get("conceptual_correctness", 32),
                "conceptCoverage": cb.get("key_concept_coverage", 20),
                "explanationQuality": cb.get("explanation_quality", 12),
                "practicalApplication": cb.get("practical_application", 8),
                "clarityAndStructure": cb.get("clarity_and_structure", 8),
            },
            "correctConcepts": eval_res.get("correct_concepts", ["Core principles"]),
            "missingConcepts": eval_res.get("missing_concepts", ["Edge cases & recovery"]),
            "correctedAnswer": eval_res.get("corrected_answer") or payload.referenceAnswer,
            "improvementSuggestions": eval_res.get("improvement_suggestions", ["Structure with clear code & architectural examples"]),
            "followUpQuestion": eval_res.get("follow_up_question") or "How would you handle scale degradation?",
            "confidence": eval_res.get("confidence", 0.92)
        },
        "source": "gemini-ai" if ai_provider.is_configured else "deterministic-rubric"
    }


@router.post("/generate-question")
async def generate_interviewer_question(payload: GenerateQuestionBridgeRequest):
    """Generates a new grounded interview question tailored to the topic and candidate experience."""
    questions = await question_generator.generate_questions(
        topic=payload.topic or "FastAPI & Redis Caching",
        difficulty=payload.difficulty or "Hard",
        count=1,
        question_types=["technical"],
        source_context=payload.customDocumentText
    )

    q = questions[0]
    rubric_concepts = q.get("rubric", {}).get("key_concepts", [
        "Architectural components",
        "Failure recovery",
        "Performance optimization"
    ])

    return {
        "success": True,
        "data": {
            "title": f"{payload.difficulty} {payload.category}: {payload.topic}",
            "question": q["question"],
            "topic": q["topic"],
            "category": payload.category or "Technical",
            "difficulty": q["difficulty"].capitalize(),
            "hint": q.get("hint", "Consider asynchronous non-blocking patterns."),
            "referenceAnswer": q["reference_answer"],
            "rubricConcepts": rubric_concepts,
            "expectedDurationSec": 180
        }
    }
