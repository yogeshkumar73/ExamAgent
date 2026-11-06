import json
import time
from typing import Optional, Any, Tuple
from app.cache.redis_client import redis_manager
from app.core.logging import logger


class CacheService:
    def __init__(self):
        pass

    async def get(self, key: str) -> Optional[str]:
        client = redis_manager.get_client()
        try:
            return await client.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return None

    async def set(self, key: str, value: str, ttl_seconds: int = 3600) -> bool:
        client = redis_manager.get_client()
        try:
            return await client.set(key, value, ex=ttl_seconds)
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False

    async def get_json(self, key: str) -> Optional[Any]:
        raw = await self.get(key)
        if raw:
            try:
                return json.loads(raw)
            except Exception:
                return None
        return None

    async def set_json(self, key: str, data: Any, ttl_seconds: int = 3600) -> bool:
        try:
            serialized = json.dumps(data)
            return await self.set(key, serialized, ttl_seconds)
        except Exception as e:
            logger.error(f"Cache set_json serialization error for '{key}': {e}")
            return False

    async def delete(self, key: str) -> bool:
        client = redis_manager.get_client()
        try:
            res = await client.delete(key)
            return bool(res)
        except Exception as e:
            logger.error(f"Cache delete error for '{key}': {e}")
            return False

    async def check_rate_limit(self, identifier: str, limit: int = 60, window_sec: int = 60) -> Tuple[bool, int, int]:
        """
        Token bucket / sliding window rate limiter.
        Returns: (is_allowed, remaining_requests, reset_after_seconds)
        """
        key = f"rate_limit:{identifier}"
        client = redis_manager.get_client()
        try:
            current = await client.incr(key)
            if current == 1:
                await client.expire(key, window_sec)
            
            if current > limit:
                return False, 0, window_sec
            
            remaining = max(0, limit - current)
            return True, remaining, window_sec
        except Exception as e:
            logger.warning(f"Rate limiter bypass due to cache error: {e}")
            return True, limit, window_sec

    async def acquire_lock(self, lock_key: str, ttl_seconds: int = 10) -> bool:
        """Lightweight distributed lock to prevent duplicate concurrent AI calls."""
        client = redis_manager.get_client()
        key = f"lock:{lock_key}"
        try:
            existing = await client.get(key)
            if existing:
                return False
            await client.set(key, "1", ex=ttl_seconds)
            return True
        except Exception:
            return True

    async def release_lock(self, lock_key: str):
        key = f"lock:{lock_key}"
        await self.delete(key)


cache_service = CacheService()
