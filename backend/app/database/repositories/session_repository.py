import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.database.mongodb import db_manager


class SessionRepository:
    def __init__(self):
        self.sessions_col_name = "practice_sessions"
        self.attempts_col_name = "answer_attempts"

    @property
    def sessions_col(self):
        return db_manager.get_collection(self.sessions_col_name)

    @property
    def attempts_col(self):
        return db_manager.get_collection(self.attempts_col_name)

    async def create_session(
        self,
        anonymous_id: str,
        content_id: Optional[str] = None,
        total_questions: int = 5,
        difficulty: str = "medium"
    ) -> Dict[str, Any]:
        session_id = f"ses_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "_id": session_id,
            "anonymous_id": anonymous_id,
            "content_id": content_id,
            "total_questions": total_questions,
            "completed_questions": 0,
            "accuracy": 0.0,
            "total_xp": 0,
            "status": "in_progress",  # in_progress, completed, abandoned
            "difficulty": difficulty,
            "created_at": now,
            "updated_at": now
        }
        await self.sessions_col.insert_one(doc)
        return doc

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return await self.sessions_col.find_one({"_id": session_id})

    async def update_session(self, session_id: str, updates: Dict[str, Any]):
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self.sessions_col.update_one({"_id": session_id}, {"$set": updates})

    async def record_attempt(
        self,
        session_id: str,
        question_id: str,
        user_answer: str,
        score: float,
        rating: str,
        missing_concepts: List[str],
        confidence: float,
        response_time_ms: int,
        xp_earned: int,
        topic: str = "General",
        difficulty: str = "medium",
        question_text: str = ""
    ) -> Dict[str, Any]:
        attempt_id = f"att_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "_id": attempt_id,
            "session_id": session_id,
            "question_id": question_id,
            "question_text": question_text,
            "topic": topic,
            "difficulty": difficulty,
            "user_answer": user_answer,
            "score": score,
            "rating": rating,
            "missing_concepts": missing_concepts,
            "confidence": confidence,
            "response_time_ms": response_time_ms,
            "xp_earned": xp_earned,
            "created_at": now
        }
        await self.attempts_col.insert_one(doc)

        # Update session completed count and xp
        session = await self.get_session(session_id)
        if session:
            completed = session.get("completed_questions", 0) + 1
            total_xp = session.get("total_xp", 0) + xp_earned
            total_q = session.get("total_questions", 5)
            status = "completed" if completed >= total_q else "in_progress"
            await self.update_session(session_id, {
                "completed_questions": completed,
                "total_xp": total_xp,
                "status": status
            })

        return doc

    async def get_attempts_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        cursor = await self.attempts_col.find({"session_id": session_id})
        return await cursor.to_list(100)

    async def get_all_attempts_by_user(self, anonymous_id: str) -> List[Dict[str, Any]]:
        # Find all user sessions first
        cursor = await self.sessions_col.find({"anonymous_id": anonymous_id})
        sessions = await cursor.to_list(100)
        session_ids = [s["_id"] for s in sessions]

        all_attempts = []
        for sid in session_ids:
            attempts = await self.get_attempts_by_session(sid)
            all_attempts.extend(attempts)
        return all_attempts


session_repo = SessionRepository()
