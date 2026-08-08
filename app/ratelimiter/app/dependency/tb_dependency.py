from fastapi import HTTPException,Request
from app.ratelimiter.app.services.token_bucket import TokenBucket
from app.database.redis import get_redis


limiter = TokenBucket(get_redis())

# Token bucket can be used for all endpoints
def token_bucket_rate_limiter(capacity:int,refill_rate:int,rate_limit_ep:str):
    async def dependency(req:Request):
        ip = ""
        x_forwarded_for = req.headers.get("x-forwarded-for")
        if x_forwarded_for:
            ip = x_forwarded_for
        else:
            ip = req.client.host

        key = f"ratelimiter:token_bucket:{rate_limit_ep}:{ip}"

        if not await limiter.is_allowed(key,capacity,refill_rate):
            raise HTTPException(status_code=429,detail="Too many requests, try again later")
    return dependency


