from app.core.database import get_redis

async def get_cache(key:str)->str | None:
    redis = get_redis()
    return await redis.get(key)

async def set_cache(key:str,value:str,ttl:int=3600)->None:
    redis = get_redis()
    return await redis.setex(key,ttl,value)