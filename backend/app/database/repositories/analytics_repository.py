from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.database.mongodb import db_manager


class AnalyticsRepository:
    def __init__(self):
        self.mastery_col_name = "topic_mastery"

    @property
    def mastery_col(self):
        return db_manager.get_collection(self.mastery_col_name)

    async def update_topic_mastery(
        self,
        anonymous_id: str,
        topic: str,
        mastery_estimate: float,
        is_correct: bool
    ):
        now = datetime.now(timezone.utc).isoformat()
        filter_q = {"anonymous_id": anonymous_id, "topic": topic}
        existing = await self.mastery_col.find_one(filter_q)

        if existing:
            attempts = existing.get("attempts", 0) + 1
            correct_count = existing.get("correct_count", 0) + (1 if is_correct else 0)
            await self.mastery_col.update_one(filter_q, {
                "$set": {
                    "mastery_estimate": mastery_estimate,
                    "attempts": attempts,
                    "correct_count": correct_count,
                    "accuracy": round(correct_count / max(1, attempts), 2),
                    "updated_at": now
                }
            })
        else:
            await self.mastery_col.insert_one({
                "_id": f"mst_{anonymous_id}_{topic}",
                "anonymous_id": anonymous_id,
                "topic": topic,
                "mastery_estimate": mastery_estimate,
                "attempts": 1,
                "correct_count": 1 if is_correct else 0,
                "accuracy": 1.0 if is_correct else 0.0,
                "updated_at": now
            })

    async def get_user_mastery(self, anonymous_id: str) -> List[Dict[str, Any]]:
        cursor = await self.mastery_col.find({"anonymous_id": anonymous_id})
        items = await cursor.to_list(100)
        return items


analytics_repo = AnalyticsRepository()
