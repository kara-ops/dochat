from pathlib import Path
import time
from redis.asyncio import Redis 
from app.database.redis import get_redis
from fastapi import Depends

_SCRIPT_PATH = Path(__file__).parent.parent / 'scripts' / 'sliding_window.lua'

class SlidingWindowLimiter:
    def __init__(self,redis:Redis):
        self.redis = redis
        self._script = self.redis.register_script(_SCRIPT_PATH.read_text())

    async def is_allowed(self, key:str, window: int, limit: int,uuid:int) -> bool:
        now = time.time()
        result = await self._script(keys=[key], args=[now, window, limit, uuid])
        return result == 1
    