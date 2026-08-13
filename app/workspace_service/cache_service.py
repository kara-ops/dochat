from app.core.database import get_redis

async def cache_my_role(role:str,user_id:int,wk_id:int):
    redis = get_redis()
    key = f"user:{user_id}:workspace:{wk_id}"
    ttl = 60*60
    await redis.set(key,role,ttl,nx=True)

async def get_my_cached_role(wk_id:int,user_id:int):
    redis = get_redis()
    key = f"user:{user_id}:workspace:{wk_id}"
    return await redis.get(key)

async def delete_my_cached_role(wk_id:int,user_id:int):
    redis = get_redis()
    key = f"user:{user_id}:workspace:{wk_id}"
    await redis.delete(key)