import asyncio
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
from app.core.logging import logger


class InMemoryDocumentCollection:
    """In-memory collection mimicking Motor/MongoDB async API for local execution."""
    def __init__(self, name: str):
        self.name = name
        self.documents: Dict[str, Dict[str, Any]] = {}

    async def insert_one(self, doc: Dict[str, Any]):
        doc_id = str(doc.get("_id", f"id_{len(self.documents)+1}"))
        doc["_id"] = doc_id
        self.documents[doc_id] = doc.copy()
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def find_one(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self.documents.values():
            match = True
            for k, v in filter_query.items():
                if k == "$or" and isinstance(v, list):
                    or_match = False
                    for cond in v:
                        if all(doc.get(ck) == cv for ck, cv in cond.items()):
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc.copy()
        return None

    async def find(self, filter_query: Optional[Dict[str, Any]] = None, limit: int = 100) -> Any:
        results = []
        for doc in self.documents.values():
            if not filter_query:
                results.append(doc.copy())
            else:
                match = True
                for k, v in filter_query.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    results.append(doc.copy())
            if len(results) >= limit:
                break
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            async def to_list(self, length: int = 100):
                return self.items[:length]
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
        return Cursor(results)

    async def update_one(self, filter_query: Dict[str, Any], update_doc: Dict[str, Any], upsert: bool = False):
        doc = await self.find_one(filter_query)
        if doc:
            doc_id = doc["_id"]
            if "$set" in update_doc:
                for k, v in update_doc["$set"].items():
                    self.documents[doc_id][k] = v
            if "$inc" in update_doc:
                for k, v in update_doc["$inc"].items():
                    self.documents[doc_id][k] = self.documents[doc_id].get(k, 0) + v
            if "$push" in update_doc:
                for k, v in update_doc["$push"].items():
                    if k not in self.documents[doc_id] or not isinstance(self.documents[doc_id][k], list):
                        self.documents[doc_id][k] = []
                    self.documents[doc_id][k].append(v)
            if "$addToSet" in update_doc:
                for k, v in update_doc["$addToSet"].items():
                    if k not in self.documents[doc_id] or not isinstance(self.documents[doc_id][k], list):
                        self.documents[doc_id][k] = []
                    if v not in self.documents[doc_id][k]:
                        self.documents[doc_id][k].append(v)
        elif upsert:
            new_doc = filter_query.copy()
            if "$set" in update_doc:
                new_doc.update(update_doc["$set"])
            await self.insert_one(new_doc)

    async def delete_one(self, filter_query: Dict[str, Any]):
        doc = await self.find_one(filter_query)
        if doc and doc["_id"] in self.documents:
            del self.documents[doc["_id"]]

    async def delete_many(self, filter_query: Dict[str, Any]):
        keys_to_del = []
        for k, doc in self.documents.items():
            match = True
            for fk, fv in filter_query.items():
                if doc.get(fk) != fv:
                    match = False
                    break
            if match:
                keys_to_del.append(k)
        for k in keys_to_del:
            del self.documents[k]

    async def create_index(self, *args, **kwargs):
        pass


class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.is_connected = False
        self._mock_collections: Dict[str, InMemoryDocumentCollection] = {}

    async def connect(self):
        try:
            client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000
            )
            # Ping to verify
            await client.admin.command('ping')
            self.client = client
            self.db = client[settings.MONGODB_DB_NAME]
            self.is_connected = True
            logger.info(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
            await self._create_indexes()
        except Exception as e:
            self.is_connected = False
            self.client = None
            self.db = None
            logger.warning(f"MongoDB not available at {settings.MONGODB_URI} ({e}). Using resilient in-memory database fallback.")

    async def _create_indexes(self):
        if not self.db:
            return
        try:
            await self.db.content.create_index("content_hash")
            await self.db.practice_sessions.create_index("anonymous_id")
            await self.db.practice_sessions.create_index("session_id")
            await self.db.answer_attempts.create_index("session_id")
            await self.db.answer_attempts.create_index("question_id")
            await self.db.gamification.create_index("anonymous_id", unique=True)
            await self.db.users.create_index("username", unique=True)
            await self.db.users.create_index("email", unique=True)
        except Exception as e:
            logger.warning(f"Index creation notice: {e}")

    async def close(self):
        if self.client:
            self.client.close()

    def get_collection(self, collection_name: str):
        if self.is_connected and self.db is not None:
            return self.db[collection_name]
        if collection_name not in self._mock_collections:
            self._mock_collections[collection_name] = InMemoryDocumentCollection(collection_name)
        return self._mock_collections[collection_name]


db_manager = DatabaseManager()
