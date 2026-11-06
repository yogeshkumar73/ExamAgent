import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.database.mongodb import db_manager


class QuestionRepository:
    def __init__(self):
        self.collection_name = "questions"

    @property
    def col(self):
        return db_manager.get_collection(self.collection_name)

    async def save_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        q_id = question_data.get("id") or f"q_{uuid.uuid4().hex[:12]}"
        doc = {
            "_id": q_id,
            "content_id": question_data.get("content_id"),
            "topic": question_data.get("topic", "General"),
            "question": question_data.get("question", ""),
            "difficulty": question_data.get("difficulty", "medium"),
            "type": question_data.get("type", "descriptive"),
            "options": question_data.get("options", []),
            "reference_answer": question_data.get("reference_answer", ""),
            "rubric": question_data.get("rubric", {}),
            "hint": question_data.get("hint", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.col.insert_one(doc)
        return doc

    async def get_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        return await self.col.find_one({"_id": question_id})

    async def get_by_topics(self, topics: List[str], difficulty: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if topics:
            query["topic"] = {"$in": topics}
        if difficulty:
            query["difficulty"] = difficulty
        cursor = await self.col.find(query, limit=limit)
        return await cursor.to_list(limit)


question_repo = QuestionRepository()
