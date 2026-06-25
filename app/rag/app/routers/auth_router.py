from app.rag.app.schemas.user_schema import UserRegister,UserLogin,TokenResponse
from fastapi import APIRouter,Depends
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.user_service.user import create_user,user_login,refresh_token
from app.user_service.user_model.model import User
from app.security.rate_limit import login_limit
from fastapi import Request
from app.user_service.schema.user_schema import RefreshRequest


router = APIRouter(prefix="/auth")

@router.post("/sign_up")
def user_create(user:UserRegister,db:Session=Depends(get_db)):
    sign_up  = create_user(user.email,user.password,db)
    token = user_login(user.email,user.password,db)
    return {"access_token":token["access_token"],"refresh_token":token["refresh_token"],"token_type":"bearer"}

@router.post("/sign_in")
def login(user:UserLogin,req:Request,db:Session=Depends(get_db)):
    x_forwarded_for = req.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = req.client.host
    login_limit(ip)
    sign_in = user_login(user.email,user.password,db)
    return {"access_token":sign_in["access_token"],"refresh_token":sign_in["refresh_token"],"token_type":"bearer"}

@router.post("/refresh")
def refresh_logic(request:RefreshRequest):
    return refresh_token(request.refresh_token)




   
    
    

