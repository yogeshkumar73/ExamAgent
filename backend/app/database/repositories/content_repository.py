import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.database.mongodb import db_manager


class ContentRepository:
    def __init__(self):
        self.content_col_name = "content"
        self.chunks_col_name = "content_chunks"

    @property
    def content_col(self):
        return db_manager.get_collection(self.content_col_name)

    @property
    def chunks_col(self):
        return db_manager.get_collection(self.chunks_col_name)

    async def save_content(
        self,
        title: str,
        content_hash: str,
        topics: List[str],
        user_id: Optional[str] = None,
        char_count: int = 0
    ) -> Dict[str, Any]:
        content_id = f"cnt_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "_id": content_id,
            "title": title,
            "content_hash": content_hash,
            "topics": topics,
            "user_id": user_id,
            "char_count": char_count,
            "created_at": now
        }
        await self.content_col.insert_one(doc)
        return doc

    async def get_by_id(self, content_id: str) -> Optional[Dict[str, Any]]:
        return await self.content_col.find_one({"_id": content_id})

    async def get_by_hash(self, content_hash: str) -> Optional[Dict[str, Any]]:
        return await self.content_col.find_one({"content_hash": content_hash})

    async def save_chunks(self, content_id: str, chunks: List[Dict[str, Any]]):
        for idx, chunk in enumerate(chunks):
            chunk_doc = {
                "_id": f"{content_id}_chk_{idx}",
                "content_id": content_id,
                "chunk_id": idx,
                "text": chunk.get("text", ""),
                "topic": chunk.get("topic", "General"),
                "hash": chunk.get("hash", "")
            }
            await self.chunks_col.insert_one(chunk_doc)

    async def get_chunks_by_content_id(self, content_id: str) -> List[Dict[str, Any]]:
        cursor = await self.chunks_col.find({"content_id": content_id})
        return await cursor.to_list(100)


content_repo = ContentRepository()
