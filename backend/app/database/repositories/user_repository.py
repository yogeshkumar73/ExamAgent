import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.database.mongodb import db_manager


class UserRepository:
    def __init__(self):
        self.collection_name = "users"

    @property
    def col(self):
        return db_manager.get_collection(self.collection_name)

    async def create_user(self, username: str, email: str, hashed_password: str, role: str = "learner") -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        doc = {
            "_id": user_id,
            "username": username,
            "email": email.lower(),
            "hashed_password": hashed_password,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.col.insert_one(doc)
        return doc

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.col.find_one({"_id": user_id})

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return await self.col.find_one({"username": username})

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.col.find_one({"email": email.lower()})

    async def get_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Finds user by either username or email."""
        return await self.col.find_one({
            "$or": [{"username": identifier}, {"email": identifier.lower()}]
        })


user_repo = UserRepository()
