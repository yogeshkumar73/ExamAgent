import uuid
from typing import List, Dict, Any, Optional
from app.ai.provider import ai_provider
from app.ai.prompt_builder import build_question_generator_prompt
from app.ai.output_validator import parse_and_validate_json
from app.core.logging import logger

CURATED_QUESTION_BANK = [
    {
        "id": "q_fastapi_async",
        "topic": "FastAPI & Async IO",
        "difficulty": "medium",
        "type": "technical",
        "question": "How does FastAPI handle asynchronous requests with async def vs regular def, and when should you avoid using async def?",
        "options": [],
        "reference_answer": "FastAPI runs async def endpoints directly on the asyncio event loop. Regular def functions are dispatched to an external threadpool so they don't block the event loop. You should avoid using async def when executing CPU-bound computations or blocking synchronous I/O operations without threadpool delegation, as they will stall the entire event loop.",
        "rubric": {
            "key_concepts": ["Asyncio event loop", "Worker threadpool", "Event loop blocking", "CPU vs I/O bound"],
            "weights": {"conceptual_correctness": 40, "concept_coverage": 25, "explanation_quality": 15, "practical_application": 10, "clarity": 10}
        },
        "hint": "Consider how Starlette manages the main event loop versus anyio threadpools for blocking calls."
    },
    {
        "id": "q_redis_cache_aside",
        "topic": "Redis Caching & Invalidation",
        "difficulty": "hard",
        "type": "scenario",
        "question": "Design a Cache-Aside pattern in Redis to prevent cache stampede (thundering herd problem) for high-traffic AI evaluation endpoints.",
        "options": [],
        "reference_answer": "A Cache-Aside pattern checks Redis before invoking expensive AI models. To prevent cache stampede when keys expire under heavy concurrent load, implement distributed locking (Redis SETNX with short TTL) so only one worker queries the AI provider while others wait or return stale cache, or use probabilistic early expiration (XFetch algorithm).",
        "rubric": {
            "key_concepts": ["Cache-aside pattern", "Thundering herd / stampede", "Distributed locks with TTL", "Probabilistic early expiration"],
            "weights": {"conceptual_correctness": 40, "concept_coverage": 25, "explanation_quality": 15, "practical_application": 10, "clarity": 10}
        },
        "hint": "Think about what happens when 50 concurrent requests hit an expired key simultaneously."
    },
    {
        "id": "q_mongodb_indexing",
        "topic": "MongoDB & Data Modeling",
        "difficulty": "medium",
        "type": "technical",
        "question": "In a multi-user assessment platform, why should compound indexes be ordered (anonymous_id, created_at) rather than (created_at, anonymous_id)?",
        "options": [],
        "reference_answer": "According to the Equality, Sort, Range (ESR) rule, equality fields (anonymous_id) must precede range or sort fields (created_at) in compound indexes. This allows MongoDB to narrow down the search space to a single user's subtree immediately before sorting by timestamp, avoiding in-memory sort stages.",
        "rubric": {
            "key_concepts": ["ESR rule", "Equality before sort", "Index scan prefix", "In-memory sort avoidance"],
            "weights": {"conceptual_correctness": 40, "concept_coverage": 25, "explanation_quality": 15, "practical_application": 10, "clarity": 10}
        },
        "hint": "Recall the ESR rule for B-tree index traversal in MongoDB."
    },
    {
        "id": "q_bkt_mastery",
        "topic": "Bayesian Knowledge Tracing",
        "difficulty": "expert",
        "type": "descriptive",
        "question": "Explain the four core parameters of standard Bayesian Knowledge Tracing (BKT) and how they update a student's latent mastery state.",
        "options": [],
        "reference_answer": "BKT models latent knowledge using four parameters: P(L0) prior knowledge, P(T) transition probability from unlearned to learned, P(G) guess probability (answering correctly while not knowing), and P(S) slip probability (answering incorrectly while knowing). After each response, Bayes rule updates P(Ln|Observation), which is then updated for learning transition P(Ln+1) = P(Ln) + (1 - P(Ln)) * P(T).",
        "rubric": {
            "key_concepts": ["P(L0) prior", "P(T) transition", "P(G) guess", "P(S) slip", "Posterior update"],
            "weights": {"conceptual_correctness": 40, "concept_coverage": 25, "explanation_quality": 15, "practical_application": 10, "clarity": 10}
        },
        "hint": "Recall the probabilities for slip, guess, transition, and initial knowledge."
    },
    {
        "id": "q_mcq_poly",
        "topic": "Object Oriented Programming",
        "difficulty": "easy",
        "type": "mcq",
        "question": "Which principle of OOP allows a method in a derived class to have the same signature as a method in its base class but with different behavior?",
        "options": ["Encapsulation", "Method Overriding (Runtime Polymorphism)", "Method Overloading", "Data Abstraction"],
        "reference_answer": "Method Overriding (Runtime Polymorphism)",
        "rubric": {
            "key_concepts": ["Runtime polymorphism", "Method overriding", "Dynamic dispatch"],
            "weights": {"conceptual_correctness": 100}
        },
        "hint": "This occurs at runtime when dynamic dispatch selects the subclass implementation."
    }
]


class QuestionGenerator:
    async def generate_questions(
        self,
        topic: str,
        difficulty: str = "medium",
        count: int = 3,
        question_types: Optional[List[str]] = None,
        source_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        types = question_types or ["descriptive", "technical", "scenario", "mcq"]
        results = []

        if ai_provider.is_configured:
            for i in range(count):
                q_type = types[i % len(types)]
                system_inst, prompt = build_question_generator_prompt(topic, difficulty, q_type, source_context)
                raw = await ai_provider.generate_text(system_inst, prompt)
                if raw:
                    parsed = parse_and_validate_json(raw)
                    if parsed and "question" in parsed:
                        q_id = f"q_gen_{uuid.uuid4().hex[:8]}"
                        parsed["id"] = q_id
                        results.append(parsed)

        # Fallback to curated question bank if needed
        if len(results) < count:
            needed = count - len(results)
            # Find matching or fallback questions
            matched = [q for q in CURATED_QUESTION_BANK if topic.lower() in q["topic"].lower()]
            if not matched:
                matched = CURATED_QUESTION_BANK
            for i in range(needed):
                item = matched[i % len(matched)].copy()
                item["id"] = f"{item['id']}_{uuid.uuid4().hex[:6]}"
                results.append(item)

        return results[:count]


question_generator = QuestionGenerator()
