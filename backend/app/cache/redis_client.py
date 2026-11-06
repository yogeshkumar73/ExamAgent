import json
import time
from typing import Optional, Any
import redis.asyncio as aioredis
from app.config import settings
from app.core.logging import logger


class InMemoryCacheFallback:
    """High-performance in-memory fallback for local development or when Redis is unavailable."""
    def __init__(self):
        self._store = {}
        self._expiry = {}

    def _purge_expired(self, key: str) -> bool:
        if key in self._expiry and time.time() > self._expiry[key]:
            del self._store[key]
            del self._expiry[key]
            return True
        return False

    async def get(self, key: str) -> Optional[str]:
        if self._purge_expired(key) or key not in self._store:
            return None
        return self._store[key]

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._store[key] = value
        if ex:
            self._expiry[key] = time.time() + ex
        elif key in self._expiry:
            del self._expiry[key]
        return True

    async def delete(self, key: str) -> int:
        if key in self._store:
            del self._store[key]
            self._expiry.pop(key, None)
            return 1
        return 0

    async def incr(self, key: str) -> int:
        self._purge_expired(key)
        val = int(self._store.get(key, 0)) + 1
        self._store[key] = str(val)
        return val

    async def expire(self, key: str, seconds: int) -> bool:
        if key in self._store:
            self._expiry[key] = time.time() + seconds
            return True
        return False


class RedisManager:
    def __init__(self):
        self.client: Optional[aioredis.Redis] = None
        self.fallback = InMemoryCacheFallback()
        self.is_connected = False

    async def connect(self):
        try:
            client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0
            )
            await client.ping()
            self.client = client
            self.is_connected = True
            logger.info("Successfully connected to Redis instance.")
        except Exception as e:
            self.is_connected = False
            self.client = None
            logger.warning(f"Redis not available at {settings.REDIS_URL} ({e}). Using resilient in-memory cache fallback.")

    async def close(self):
        if self.client:
            await self.client.close()

    def get_client(self):
        if self.is_connected and self.client:
            return self.client
        return self.fallback


redis_manager = RedisManager()
