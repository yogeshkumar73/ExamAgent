import re
from typing import Dict, Any, List, Optional
from app.ai.provider import ai_provider
from app.ai.prompt_builder import build_evaluation_prompt
from app.ai.output_validator import parse_and_validate_json
from app.schemas.evaluation import EvaluationData, CriterionBreakdown
from app.core.logging import logger


def calculate_deterministic_evaluation(
    question: str,
    reference_answer: str,
    user_answer: str,
    rubric_concepts: List[str]
) -> Dict[str, Any]:
    """
    Deterministic rule-based rubric evaluation fallback ensuring 100% uptime
    even if the AI provider or external network is unavailable.
    """
    user_clean = user_answer.lower()
    total_rubric = max(1, len(rubric_concepts))
    
    matched_concepts = []
    missing_concepts = []
    
    for c in rubric_concepts:
        # Check token or concept appearance
        c_clean = c.lower()
        tokens = [t for t in re.split(r'[^a-zA-Z0-9]', c_clean) if len(t) > 3]
        if any(token in user_clean for token in tokens) or c_clean in user_clean:
            matched_concepts.append(c)
        else:
            missing_concepts.append(c)

    coverage_ratio = len(matched_concepts) / float(total_rubric)
    length_bonus = min(1.0, len(user_answer.split()) / 40.0)
    
    # 5-part rubric weights
    c_correct = round(40.0 * min(1.0, coverage_ratio * 1.1), 1)
    k_coverage = round(25.0 * coverage_ratio, 1)
    e_quality = round(15.0 * (0.5 * coverage_ratio + 0.5 * length_bonus), 1)
    p_app = round(10.0 * (1.0 if any(w in user_clean for w in ["example", "use", "when", "trade", "production", "scale"]) else 0.5), 1)
    c_struct = round(10.0 * min(1.0, max(0.4, length_bonus)), 1)
    
    score = min(100.0, max(15.0, c_correct + k_coverage + e_quality + p_app + c_struct))
    
    if score >= 90:
        rating = "Excellent"
    elif score >= 75:
        rating = "Good"
    elif score >= 50:
        rating = "Needs Improvement"
    else:
        rating = "Weak"

    return {
        "score": round(score, 1),
        "rating": rating,
        "criterion_breakdown": {
            "conceptual_correctness": c_correct,
            "key_concept_coverage": k_coverage,
            "explanation_quality": e_quality,
            "practical_application": p_app,
            "clarity_and_structure": c_struct
        },
        "correct_concepts": matched_concepts if matched_concepts else ["Foundational understanding"],
        "missing_concepts": missing_concepts if missing_concepts else ["Edge cases & architectural trade-offs"],
        "corrected_answer": reference_answer,
        "improvement_suggestions": [
            f"Review and explicitly articulate: {', '.join(missing_concepts[:2]) if missing_concepts else 'system constraints'}.",
            "Structure explanations using concrete examples and computational trade-offs (time/space complexity)."
        ],
        "follow_up_question": f"How would your approach adapt if system throughput increased by 10x?",
        "confidence": 0.88
    }


class AnswerEvaluator:
    async def evaluate_answer(
        self,
        question: str,
        reference_answer: str,
        user_answer: str,
        rubric_concepts: Optional[List[str]] = None,
        source_context: Optional[str] = None,
        difficulty: str = "medium"
    ) -> Dict[str, Any]:
        concepts = rubric_concepts or ["Core concepts", "Implementation details", "Trade-offs"]

        if ai_provider.is_configured:
            system_inst, prompt = build_evaluation_prompt(
                question=question,
                reference_answer=reference_answer,
                user_answer=user_answer,
                rubric_concepts=concepts,
                source_context=source_context,
                difficulty=difficulty
            )
            raw_response = await ai_provider.generate_text(system_inst, prompt)
            if raw_response:
                parsed = parse_and_validate_json(raw_response)
                if parsed and "score" in parsed and "rating" in parsed:
                    # Sanitize and ensure criterion breakdown exists
                    if "criterion_breakdown" not in parsed:
                        s = float(parsed.get("score", 70))
                        parsed["criterion_breakdown"] = {
                            "conceptual_correctness": round(s * 0.4, 1),
                            "key_concept_coverage": round(s * 0.25, 1),
                            "explanation_quality": round(s * 0.15, 1),
                            "practical_application": round(s * 0.1, 1),
                            "clarity_and_structure": round(s * 0.1, 1)
                        }
                    return parsed

        logger.info("Using deterministic rubric evaluation engine.")
        return calculate_deterministic_evaluation(question, reference_answer, user_answer, concepts)


answer_evaluator = AnswerEvaluator()
