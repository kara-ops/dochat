from app.rag.app.core.database import get_redis

def get_cache(key:str)->str | None:
    redis = get_redis()
    return redis.get(key)

def set_cache(key:str,value:str,ttl:int=3600)->None:
    redis = get_redis()
    return redis.setex(key,ttl,value)