from redis.asyncio import Redis
from fastapi import HTTPException,Request


from app.database.redis import get_redis
from fastapi import HTTPException, Request

def fixed_window_rate_limiter(limit:int,ttl:int,rate_limit_ep:str,req:Request):
    async def dependency(req:Request):
            ip = ""
            x_forwarded_for = req.headers.get("x-forwarded-for")
            if x_forwarded_for:
                ip = x_forwarded_for
            else: 
                ip = req.client.host

            redis = get_redis()
  
            key = f"ratelimit:reads:{rate_limit_ep}:{ip}"


            async with redis.pipeline(transaction=True) as pipe:
                pipe.incr(key)
                pipe.expire(key,ttl,nx=True)
            result = await pipe.execute()

            attempts = result[0]

            if attempts > limit:
                raise HTTPException(status_code=429,detail="Too many request")
    return dependency
