from fastapi import APIRouter,Depends, Header, HTTPException, Request, Response
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse

from app.database.postgres import get_db

from app.utils import oauth_client 

from app.core import security 
from app.core.config import settings
from app.core.dependencies import get_current_user

from datetime import datetime, timezone

from app.services import token_service 
from app.services import auth_service

from app.models.user_model import User

from app.schemas.Oauth_schema import RefreshRequest, TokenResponse, UserPublic, UserLogin, ResetPassword, ForgotPass, SetPassword, AddPassword

from app.ratelimiter.app.dependency.tb_dependency import token_bucket_rate_limiter
from app.ratelimiter.app.dependency.fw_rate_limit import fixed_window_rate_limiter
from app.ratelimiter.app.dependency.sl_dependency import sliding_window_rate_limiter


router = APIRouter(prefix="/auth", tags =["auth"])

@router.get("/oauth")
def google_login(request : Request)->str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.client.host

    call = token_service.rate_limiter(ip)
    if not call:
        raise HTTPException(
            status_code = 429, detail = "Too many request"
        )

    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid+email+profile"
    )
    return RedirectResponse(url)

@router.get("/google/callback")
#oauth_client = oc, auth_service = a, security = s, oauth_schema = os
async def google_callback(request:Request,res:Response,code:str, db:Session = Depends(get_db),_:None=Depends(fixed_window_rate_limiter(2,5,"google_callback",Request))):
    try:
        access_token = await oauth_client.exchange_code_for_token(code)
        print("access_token : ", access_token)
    except Exception as e:
        raise


    
    get_user_data = await oauth_client.get_google_user(access_token)
    user_info = get_user_data

    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.client.host

    ua = request.headers.get("User-Agent")



    get_or_create = await auth_service.get_or_create_user(db,user_info,ip,ua)

    create_access =  get_or_create["access"]
    create_refresh = get_or_create["refresh"]
    
    redirect_res = RedirectResponse(url=f"http://localhost:5173/oauth/callback?access_token={create_access}")
    redirect_res.set_cookie(
        key="refresh",
        value=create_refresh,
        max_age=60*60*24*7,
        samesite="lax",
        httponly=True,
        secure=True
    )

    return redirect_res


#rotate refresh token
@router.post("/refresh", response_model = TokenResponse )
async def refresh_logic(req:Request,res:Response,db:Session=Depends(get_db),_:None=Depends(sliding_window_rate_limiter(window=10,limit=3,rate_limit_ep="refresh_login"))):
    refresh_token = req.cookies.get("refresh")
    
    if not refresh_token:
        raise HTTPException(status_code=401,detail="Token is missing")

    call = await auth_service.refresh_token(refresh_token,db)
    token = call["refresh"]

    res.set_cookie(
        key="refresh",
        max_age=60*60*24*7,
        value=token,
        secure=True,
        samesite="lax",
        httponly=True,
        )



    return TokenResponse(access_token=call["access"],token_type="bearer")

@router.post("/logout")
def logout(res:Response,authorization: str = Header()):
    try:
        scheme,access = authorization.split()
        if scheme.lower() != "bearer":
            raise Exception()
        
    except ValueError:
        raise HTTPException(
            status_code = 401,
            detail = "Invalid token"
        )
    
    decode = security.decode_token(access)
    if decode["type"] != "access":
        raise HTTPException(
            status_code = 401,
            detail = "Invalid token"
        )

    remain_ttl = int(decode["exp"] - datetime.now(timezone.utc).timestamp())
    if remain_ttl <0:
        remain_ttl = 0

    res.delete_cookie("refresh")
    return {
        "message":"logged out"
    }

@router.post("/login")
async def local_login(res:Response,req:Request,user:UserLogin,db:Session=Depends(get_db), _:None=Depends(sliding_window_rate_limiter(window=4,limit=1,rate_limit_ep="local_login"))):
    ip =""
    x_forwarded_for = req.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for
    else:
        ip = req.client.host
    
    #user-agent

    ua = req.headers.get("User-Agent")

    login = await auth_service.login_l_user(ip,ua,user.email,user.password,db)

    res.set_cookie(
        key="refresh",
        value=login["refresh"],
        max_age=60*60*24*7,
        samesite="lax",
        httponly=True,
        secure=True
    )
    return {"access_token":login["access"],"token_type":"bearer"}

@router.post("/create-user")
async def create_local_user(res:Response,req:Request,user:UserLogin,db:Session=Depends(get_db), _:None=Depends(sliding_window_rate_limiter(window=4,limit=1,rate_limit_ep="create_local_user"))):


    #user ip address
    ip =""
    x_forwarded_for = req.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for
    else:
        ip = req.client.host
    
    #user-agent

    ua = req.headers.get("User-Agent")

    #service call
    create = await auth_service.create_l_user(ip,ua,user.email,user.password,db)

    res.set_cookie(
        key="refresh",
        value=create["refresh"],
        max_age=60*60*24*7,
        samesite="lax",
        httponly=True,
        secure=True

    )
    return {"access_token":create["access"],"type":"bearer"}
    


@router.patch("/reset-password")
async def reset_password(user:ResetPassword,db:Session=Depends(get_db),auth:User=Depends(get_current_user), _:None=Depends(sliding_window_rate_limiter(window=5,limit=1,rate_limit_ep="reset_password"))):
    call_func = await auth_service.reset_pass(auth["user"].id,user.new_password,user.current_password,db)
    return call_func


@router.post("/forgot-password")
async def forgot_pass(user:ForgotPass,db:Session=Depends(get_db)):
    return await auth_service.forgot_password(user.email,db)

@router.patch("/set-password")
async def set_password(token:str,user:SetPassword,db:Session=Depends(get_db)):
    call_func = await auth_service.new_password(user.code,user.new_password,db,token)
    return call_func

@router.post("/add-password")
async def add_pass(req:AddPassword,db:Session=Depends(get_db),user:User=Depends(get_current_user),_:None=Depends(token_bucket_rate_limiter(5,1,"get_sessions"))):
    check = await auth_service.add_password(user["user"].id,req.new_password,db)
    return check

@router.get("/get-session")
async def get_sessions(db:Session=Depends(get_db),user:dict=Depends(get_current_user)):
    call = await auth_service.get_session(user["user"].id,user["payload"]["sid"],db)
    return call


