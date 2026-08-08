from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import HTTPException
from app.core.config import settings
from datetime import timedelta, datetime, timezone

# Token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession as Session
from app.models.user_model import UserSession
from app.utils.code_gen import sha_hash
from app.utils.time_calc import current_time

from app.schemas.Oauth_schema import UserSessionModel

from uuid import uuid4



def create_access_token(user_id:int,sid:str)->str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    current = datetime.now(timezone.utc)
    jti = str(uuid4())
    payload = {
        "exp":expire,
        "iat":current,
        "jti" : jti,
        "sid":str(sid),
        "type" : "access",
        "sub" : str(user_id)

    }
    return jwt.encode(payload,settings.SECRET_KEY,algorithm=settings.ALGORITHM)

def create_refresh_token(user_id:int,sid:str)->str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    current = datetime.now(timezone.utc)
    jti = str(uuid4())

    payload = {
        "exp": expire,
        "iat":current,
        "sid":str(sid),
        "type": "refresh",
        "sub": str(user_id),
        "jti": jti
    }
    return jwt.encode(payload,settings.SECRET_KEY,algorithm=settings.ALGORITHM)


async def decode_token_r(token:str,db:Session)->dict:
    try:
        payload = jwt.decode(token,settings.SECRET_KEY,algorithms=settings.ALGORITHM)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code = 401, detail = "Invalid or Expired Token"
        )
    except JWTError:
        raise HTTPException(
            status_code = 401, detail = "Invalid or Expired Token"
        )
    
    if payload["type"] != "refresh":
        raise HTTPException(status_code=400,detail="Invalid token")
    
    query = await db.execute(select(UserSession).where(UserSession.session_id==payload["sid"]))
    store = query.scalar_one_or_none()
    check = UserSessionModel.model_validate(store)
    if check is None:
        raise HTTPException(status_code=404,detail="Session not found")
    
    curr_time = current_time()
    if check.revoked_at != None:
        raise HTTPException(status_code=400,detail="Invalid or Expired Token")
    elif check.expires_at < curr_time:
        raise HTTPException(status_code=400,detail="Invalid or Expired Tokens")
    elif sha_hash(token) != check.r_token_hash:
        raise HTTPException(status_code=400,detail="Invalid or Expired Tokena")
    return payload
    

#decode access token only
def decode_token(token:str)->dict:
    try:
        payload = jwt.decode(token,settings.SECRET_KEY,algorithms=[settings.ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401,detail="Invalid or Expired token")
    except JWTError:
        raise HTTPException(status_code=401,detail="Invalid or Expired token")
    
    if payload["type"] != "access":
        raise HTTPException(status_code=400,detail="Invalid token")
    return payload




    
    




