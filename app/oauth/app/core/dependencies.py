from fastapi import Depends,HTTPException, Header

from sqlalchemy.ext.asyncio import AsyncSession as Session
from sqlalchemy import select

from app.database.postgres import get_db

from app.core.security import decode_token

from app.services.token_service import get_user,cache_my_user

from app.models.user_model import User

from app.schemas.Oauth_schema import UserBaseModel

async def get_current_user(authorization: str = Header(), db:Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(
            status_code = 401, detail = "Header missing"
        )
    
    parts = authorization.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code = 401, detail = "Invalid token format"
        )
    
    access = parts[1]

    decode = decode_token(access)
    if decode["type"] != "access":
        raise HTTPException(
            status_code = 401,
            detail = "Invalid token"
        )

    user_data = await get_user(decode["sub"])
    if user_data:
        return {"user":UserBaseModel.model_validate_json(user_data),
                "payload":decode}
    
    check = await db.execute(select(User).where(User.id==int(decode["sub"])))
    querry = check.scalar_one_or_none()
    if not querry:
        raise HTTPException(
            status_code = 401,
            detail = "User not found"
        )
    user = UserBaseModel.model_validate(querry)
    await cache_my_user(decode["sub"],user)
    return {"user":user,
            "payload":decode}
