from pathlib import Path
import time
from  redis.asyncio import Redis

_SCRIPT_PATH = Path(__file__).parent.parent / 'scripts' / 'token_bucket.lua'

class TokenBucket:
    def __init__(self,redis:Redis):
        self.redis = redis
        self._script = self.redis.register_script(_SCRIPT_PATH.read_text())

    async def is_allowed(self, key:str, capacity:int, refill_rate:int):
        now = time.time()
        result = await self._script(keys=[key],args=[now,capacity, refill_rate])
        return result == 1

    