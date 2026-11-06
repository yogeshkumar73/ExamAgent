import hashlib
from typing import List, Dict, Any, Optional
from app.ai.generator import question_generator
from app.database.repositories.question_repository import question_repo
from app.database.repositories.content_repository import content_repo
from app.cache.cache_service import cache_service
from app.utils.hashing import compute_content_hash
from app.core.exceptions import ResourceNotFoundException


class QuestionService:
    async def generate_questions(
        self,
        content_id: Optional[str] = None,
        topics: Optional[List[str]] = None,
        question_count: int = 5,
        difficulty: str = "medium",
        question_types: Optional[List[str]] = None,
        context_text: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        source_context = context_text or ""
        selected_topics = topics or []

        if content_id:
            content = await content_repo.get_by_id(content_id)
            if content:
                if not selected_topics:
                    selected_topics = content.get("topics", [])
                chunks = await content_repo.get_chunks_by_content_id(content_id)
                if chunks:
                    source_context = "\n".join([c.get("text", "") for c in chunks[:3]])

        primary_topic = selected_topics[0] if selected_topics else "FastAPI & Distributed Systems"

        # Check Redis Cache (Section 8: questions:{content_hash}:{config_hash} TTL 12h)
        ctx_hash = compute_content_hash(source_context or primary_topic)
        config_hash = hashlib.md5(f"{difficulty}_{question_count}_{','.join(selected_topics)}".encode()).hexdigest()[:8]
        cache_key = f"questions:{ctx_hash}:{config_hash}"

        cached = await cache_service.get_json(cache_key)
        if cached and isinstance(cached, list) and len(cached) >= question_count:
            return cached[:question_count]

        # Generate questions
        raw_questions = await question_generator.generate_questions(
            topic=primary_topic,
            difficulty=difficulty,
            count=question_count,
            question_types=question_types,
            source_context=source_context
        )

        saved_questions = []
        for q in raw_questions:
            q["content_id"] = content_id
            saved = await question_repo.save_question(q)
            saved_questions.append({
                "id": saved["_id"],
                "content_id": saved.get("content_id"),
                "topic": saved["topic"],
                "difficulty": saved["difficulty"],
                "type": saved["type"],
                "options": saved.get("options", []),
                "question": saved["question"],
                "reference_answer": saved["reference_answer"],
                "rubric": saved.get("rubric", {}),
                "hint": saved.get("hint", "")
            })

        # Cache for 12 hours (43200 seconds)
        await cache_service.set_json(cache_key, saved_questions, ttl_seconds=43200)
        return saved_questions

    async def get_question(self, question_id: str) -> Dict[str, Any]:
        q = await question_repo.get_by_id(question_id)
        if not q:
            raise ResourceNotFoundException("Question", question_id)
        return {
            "id": q["_id"],
            "content_id": q.get("content_id"),
            "topic": q["topic"],
            "difficulty": q["difficulty"],
            "type": q["type"],
            "options": q.get("options", []),
            "question": q["question"],
            "reference_answer": q["reference_answer"],
            "rubric": q.get("rubric", {}),
            "hint": q.get("hint", "")
        }


question_service = QuestionService()
