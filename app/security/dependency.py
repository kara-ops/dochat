from fastapi import Header, HTTPException,Depends
from sqlalchemy.orm import Session
from app.security.jwt_handler import decode_token,oauth2_scheme
from app.user_service.user_model.model import User
from app.workspace_service.model import WorkSpaceMember
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


role_rank ={
    "owner":4,
    "admin":3,
    "member":2,
    "viewer":1
}
def require_role(minimum_role:str,wk_id:int,user_id:int,db:Session):
    get = db.query(WorkSpaceMember).filter(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id == user_id)
    if not get:
        raise HTTPException(
            status_code=403,detail="Not participant of this workspace"
        )
    if role_rank[get.role]>=role_rank[minimum_role]:
        return {"access":"approved"}
    else:
        raise HTTPException(status_code=403,detail="You cant access this")