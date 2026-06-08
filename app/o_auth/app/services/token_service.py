from app.database.redis import get_redis

def store_refresh_token(user_id:int, refresh_token:str)->None:
    redis = get_redis()
    key = f"refresh:{user_id}"
    ttl = 60*60*24*7
    redis.setex(key, ttl, refresh_token)
    
def verify_refresh_token(user_id:int, refresh_token:str)->bool:
    key = f"refresh:{user_id}"
    redis = get_redis()
    check_value = redis.get(key)
    return check_value==refresh_token

def delete_refresh_token(user_id:int)->None:
    redis = get_redis()
    key = f"refresh:{user_id}"
    redis.delete(key)

def blacklist_token(jti:str, ttl:int)->None:
    redis = get_redis()
    key = f"blacklist:{jti}"
    redis.setex(key, ttl, "1")

def is_blacklisted(jti:str)->bool:
    redis = get_redis()
    key = f"blacklist:{jti}"
    return redis.exists(key)==1

def rate_limiter(ip:str)->bool:
    redis = get_redis()
    ttl = 60
    key = f"login attempts:{ip}"
    attemps = redis.incr(key)
    if attemps == 1:
        redis.expire(key, ttl)

    if attemps >= 5:
        return False
    else:
        return True


