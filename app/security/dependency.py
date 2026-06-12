from fastapi import Header, HTTPException,Depends
from sqlalchemy.orm import Session
from app.security.jwt_handler import decode_token,oauth2_scheme
from app.user_service.user_model.model import User
from app.core.database import get_db


def get_current_user(token:str=Depends(oauth2_scheme),db:Session=Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401,detail="Header missing")
    
    access = token
    decode = decode_token(access)
    if not decode:
        raise HTTPException(
            status_code=401,detail="Invalid token"
        )
    if decode["type"] != "access":
        raise HTTPException(
            status_code=400,detail="Invalid token"
        )
    
    query = db.query(User).filter(User.id==int(decode["sub"])).first()
    if not query:
        raise HTTPException(status_code=401,detail="User not found")
    
    return query
