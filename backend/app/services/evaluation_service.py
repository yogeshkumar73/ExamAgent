import hashlib
from typing import Dict, Any, List, Optional
from app.ai.evaluator import answer_evaluator
from app.database.repositories.question_repository import question_repo
from app.database.repositories.session_repository import session_repo
from app.database.repositories.gamification_repository import gamification_repo
from app.database.repositories.analytics_repository import analytics_repo
from app.cache.cache_service import cache_service
from app.ml.mastery_model import bkt_model, update_ema_mastery
from app.ml.difficulty_model import adapt_next_difficulty
from app.utils.hashing import compute_content_hash
from app.core.exceptions import ResourceNotFoundException
from app.core.logging import logger

# Section 7: Gamification rewards
XP_MAP = {
    "easy": 10,
    "medium": 20,
    "hard": 30,
    "expert": 50
}


class EvaluationService:
    async def evaluate_submission(
        self,
        session_id: str,
        question_id: str,
        user_answer: str,
        response_time_ms: int = 0
    ) -> Dict[str, Any]:
        # 1. Retrieve session and question
        session = await session_repo.get_session(session_id)
        if not session:
            raise ResourceNotFoundException("Session", session_id)

        question = await question_repo.get_by_id(question_id)
        if not question:
            raise ResourceNotFoundException("Question", question_id)

        anonymous_id = session.get("anonymous_id", "guest")
        topic = question.get("topic", "General")
        difficulty = question.get("difficulty", "medium")
        ref_answer = question.get("reference_answer", "")
        rubric_concepts = question.get("rubric", {}).get("key_concepts", [])

        # 2. Check Redis Cache (Section 8: evaluation:{question_hash}:{answer_hash}:{rubric_version} TTL 1h)
        q_hash = compute_content_hash(question.get("question", ""))
        ans_hash = compute_content_hash(user_answer)
        cache_key = f"evaluation:{q_hash}:{ans_hash}:v1"

        eval_result = await cache_service.get_json(cache_key)
        if not eval_result:
            # 3. Evaluate using AI / Rubric engine
            eval_result = await answer_evaluator.evaluate_answer(
                question=question.get("question", ""),
                reference_answer=ref_answer,
                user_answer=user_answer,
                rubric_concepts=rubric_concepts,
                difficulty=difficulty
            )
            # Cache for 1 hour (3600 seconds)
            await cache_service.set_json(cache_key, eval_result, ttl_seconds=3600)

        score = float(eval_result.get("score", 70))
        rating = eval_result.get("rating", "Good")
        is_correct = score >= 75

        # 4. Calculate XP rewards (Section 7)
        base_xp = XP_MAP.get(difficulty.lower(), 20)
        xp_earned = int(base_xp * (score / 100.0))
        if score >= 95:
            xp_earned += 10  # Perfect answer bonus

        # 5. Adapt next difficulty (Section 4 & 6)
        next_diff = adapt_next_difficulty(difficulty, score)

        # 6. Save attempt in MongoDB
        attempt = await session_repo.record_attempt(
            session_id=session_id,
            question_id=question_id,
            user_answer=user_answer,
            score=score,
            rating=rating,
            missing_concepts=eval_result.get("missing_concepts", []),
            confidence=float(eval_result.get("confidence", 0.90)),
            response_time_ms=response_time_ms,
            xp_earned=xp_earned,
            topic=topic,
            difficulty=difficulty,
            question_text=question.get("question", "")
        )

        # 7. Update Analytics and BKT Mastery (Section 6)
        existing_mastery_list = await analytics_repo.get_user_mastery(anonymous_id)
        current_mastery_record = next((m for m in existing_mastery_list if m.get("topic") == topic), None)
        prev_p_known = current_mastery_record.get("mastery_estimate", 0.40) if current_mastery_record else 0.40
        new_p_known = bkt_model.update(prev_p_known, is_correct)
        await analytics_repo.update_topic_mastery(anonymous_id, topic, new_p_known, is_correct)

        # 8. Award XP idempotently (Section 7)
        await gamification_repo.add_xp(anonymous_id, xp_earned)

        return {
            "score": score,
            "rating": rating,
            "correct_answer": eval_result.get("corrected_answer") or ref_answer,
            "correct_concepts": eval_result.get("correct_concepts", []),
            "missing_concepts": eval_result.get("missing_concepts", []),
            "improvement_suggestions": eval_result.get("improvement_suggestions", []),
            "xp_earned": xp_earned,
            "next_difficulty": next_diff,
            "confidence": float(eval_result.get("confidence", 0.92)),
            "criterion_breakdown": eval_result.get("criterion_breakdown"),
            "follow_up_question": eval_result.get("follow_up_question")
        }


evaluation_service = EvaluationService()
