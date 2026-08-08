from app.database.redis import get_redis
from fastapi import HTTPException, Request
from app.ratelimiter.app.services.s_w import SlidingWindowLimiter
from app.utils.code_gen import get_uuid


limiter = SlidingWindowLimiter(get_redis())

def  sliding_window_rate_limiter(window:int, limit:int,rate_limit_ep:str):
    async def dependency(req:Request):
        ip = ""
        x_forwarded_for = req.headers.get("x-forwarded-for")
        if x_forwarded_for:
            ip = x_forwarded_for
        else:
            ip = req.client.host

        key = f"ratelimit:auth:sliding_window:{rate_limit_ep}:{ip}"

        if not await limiter.is_allowed(key,window,limit,int(get_uuid())):
            raise HTTPException(status_code=429,detail="Too many request, try again later")
    return dependency

