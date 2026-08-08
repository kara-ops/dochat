from app.database.redis import get_redis
import json


    
async def forgot_pass_key(token:str,user_id:int,code:str):
    redis = get_redis()
    ttl = 60*8
    key = f"reset:{token}:{code}"
    await redis.setex(key,ttl,user_id)

async def get_forgot_pass_key(token:str,code:str):
    redis = get_redis()
    key = f"reset:{token}:{code}"
    return await redis.get(key)

async def del_forgot_pass_key(token:str,code:str):
    redis = get_redis()
    key = f"reset:{token}:{code}"
    await redis.delete(key)

async def concurrent_first_request(sid):
    redis = get_redis()
    key = f"concurrent_refresh:{sid}"
    value = {"status":"refreshing"}
    return await redis.set(key,json.dumps(value),10,nx=True)

async def concurrent_r_token(sid,a_token:str,r_token:str):
    redis = get_redis()
    key = f"concurrent_refresh:{sid}"
    value = {"status":"done",
             "access":a_token,
             "refresh":r_token}
    await redis.set(key,json.dumps(value),10)


async def get_concurrent_r_token(sid):
    redis = get_redis()
    key = f"concurrent_refresh:{sid}"
    data = await redis.get(key)
    if data:
        return json.loads(data)
    return None


async def get_user(user_id:int):
    key = f"get_my_profile:{user_id}"
    redis = get_redis()
    data = await redis.get(key)
    if data:
        return data
    return None

async def cache_my_user(user_id:int,user_data:str):
    redis = get_redis()
    key = f"get_my_profile:{user_id}"
    ttl = 60*60
    await redis.setex(key,ttl,user_data.model_dump_json())


async def get_user_session(user_id:int,session_id:int):
    redis = get_redis()
    key = f"get_my_session:{user_id}:{session_id}"
    data = await redis.get(key)
    if data:
        return json.loads(data)
    return None

async def cache_user_session(user_id:int,session_id:str,session_data:str):
    redis = get_redis()
    key = f"get_my_session:{user_id}:{session_id}"
    ttl = 60*60
    await redis.setex(key,ttl,json.dumps(session_data,default=str))

async def delete_user_session(user_id:int,session_id:str):
    redis = get_redis()
    key = f"get_my_session:{user_id}:{session_id}"
    await redis.delete(key)

# async def store_refresh_token(user_id:int, refresh_token:str)->None:
#     redis = get_redis()
#     key = f"refresh:{user_id}"
#     ttl = 60*60*24*7
#     await redis.setex(key, ttl, refresh_token)
    
# async def verify_refresh_token(user_id:int, refresh_token:str)->bool:
#     key = f"refresh:{user_id}"
#     redis = get_redis()
#     check_value = redis.get(key)
#     return await check_value==refresh_token

# async def delete_refresh_token(user_id:int)->None:
#     redis = get_redis()
#     key = f"refresh:{user_id}"
#     await redis.delete(key)

# async def blacklist_token(jti:str, ttl:int)->None:
#     redis = get_redis()
#     key = f"blacklist:{jti}"
#     await redis.setex(key, ttl, "1")

# async def is_blacklisted(jti:str)->bool:
#     redis = get_redis()
#     key = f"blacklist:{jti}"
#     return await redis.exists(key)==1

# async def rate_limiter(ip:str)->bool:
    # redis = get_redis()
    # ttl = 60
    # key = f"login attempts:{ip}"
    # attemps = await redis.incr(key)
    # if attemps == 1:
    #     await redis.expire(key, ttl)

    # if attemps >= 5:
    #     return False
    # else:
    #     return True




