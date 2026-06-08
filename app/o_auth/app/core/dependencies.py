from fastapi import Depends,HTTPException, Header
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.core.security import decode_token
from app.services.token_service import is_blacklisted
from app.models.user_model import User

def get_current_user(authorization: str = Header(), db:Session = Depends(get_db)):
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
    
    if is_blacklisted(decode["jti"]):
        raise HTTPException(
            status_code = 401,
            detail = "Token revoked"
        )
    
    querry = db.query(User).filter(User.id==int(decode["sub"])).first()
    if not querry:
        raise HTTPException(
            status_code = 401,
            detail = "User not found"
        )
    return querry
