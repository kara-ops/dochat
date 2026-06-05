from app.rag.app.core.database import get_redis
from fastapi import HTTPException


def login_limit(ip:str):
    redis = get_redis()
    key = f"login:{ip}"
    attempts = redis.incr(key)
    ttl = 60
    redis.expire(key,ttl,False)
    if attempts >= 5:
        raise HTTPException(status_code=429,detail="Too many requests")
    
def query_limit(ip:str):
    redis = get_redis()
    key = f"query:{ip}"
    attempts=redis.incr(key)
    ttl = 60
    redis.expire(key,ttl,False)
    if attempts >= 20:
        raise HTTPException(status_code=429,detail="Too many requests")
    
def upload_limit(ip:str):
    redis=get_redis()
    key=f"upload:{ip}"
    attempts=redis.incr(key)
    ttl=60
    redis.expire(key,ttl,False)
    if attempts >= 10:
        raise HTTPException(status_code=429,detail="Too many requests")
    



