from fastapi import Request,HTTPException

from app.models.user_model import User,UserAuth,UserSession
from sqlalchemy.ext.asyncio import AsyncSession as Session
from sqlalchemy import select,update
from sqlalchemy.orm import joinedload
import asyncio

from app.schemas.Oauth_schema import UserModel,UserAuthModel,UserSessionModel,UserBaseModel,GetSession,UserAndAuthModel

from app.utils.hashing import hash_password,verify_password
from app.utils.code_gen import gen_code,gen_url_token,get_uuid,user_agent_parse,sha_hash
from app.utils.email_service import forgot_pass_mail
from app.utils.time_calc import c_plus_d,current_time


from app.services.token_service import forgot_pass_key,get_forgot_pass_key,del_forgot_pass_key,concurrent_r_token,concurrent_first_request,get_concurrent_r_token,get_user_session,cache_user_session,delete_user_session
from app.services import token_service

from app.core.security import create_access_token,create_refresh_token,decode_token,decode_token_r

from starlette.concurrency import run_in_threadpool

from time import perf_counter



async def get_or_create_user(db:Session, google_user:dict,ip:str,user_agent:str)->User:
    query = await db.execute(select(User).options(joinedload(User.auth),joinedload(User.session)).where(User.email==google_user["email"]))
    email = query.unique().scalar_one_or_none()
    if email:
        fixed_db_result = (UserModel.model_validate(email))

        provider = None
        for auth in email.auth:
            if auth.provider == "google":
                provider = "google"

        if provider == "google":

            uuid_code = get_uuid()
            expire = c_plus_d(7)
            create_r = create_refresh_token(email.id,uuid_code)
            hash_r = sha_hash(create_r)
            ua_parse = user_agent_parse(user_agent)
            create_a = create_access_token(email.id,uuid_code)

            add_s = UserSession(
                session_id = uuid_code,
                user_id = email.id,

                r_token_hash = hash_r,

                device_type = ua_parse["device_type"],
                device_name = ua_parse["device"],
                browser = ua_parse["browser"],
                os = ua_parse["os"],

                ip_address = ip,
                user_agent = user_agent,

                expires_at = expire
            )
            try:
               db.add(add_s)
               await db.commit()
               await db.refresh(add_s)
            except:
                await db.rollback()
                raise
            return {"user":fixed_db_result,
                    "refresh":create_r,
                    "access":create_a
                    }
        else:
            create_user = UserAuth(
                user_id = email.id,
                provider = "google",
                provider_id = google_user["id"]
            )
            email.avatar_url = google_user["picture"]
            email.name = google_user["name"]
            
            uuid_code = get_uuid()
            expire = c_plus_d(7)
            create_r = create_refresh_token(email.id,uuid_code)
            create_a = create_access_token(email.id,uuid_code)
            hash_r = sha_hash(create_r)
            ua_parse = user_agent_parse(user_agent)

            add_s = UserSession(
                session_id = uuid_code,
                user_id = email.id,

                r_token_hash = hash_r,

                device_type = ua_parse["device_type"],
                device_name = ua_parse["device"],
                browser = ua_parse["browser"],
                os = ua_parse["os"],

                ip_address = ip,
                user_agent = user_agent,

                expires_at = expire
            )
            try:
               db.add(create_user)
               db.add(add_s)
               await db.commit()
               await db.refresh(create_user)
            except:
                await db.rollback()
                raise
            return {"user":fixed_db_result,
                    "refresh":create_r,
                    "access": create_a
                    }
    else:
        user = User(
            email = google_user["email"],
            name = google_user["name"],
            avatar_url = google_user["picture"],
        )
        db.add(user)
        await db.flush()

        user_auth = UserAuth(
            provider = "google",
            provider_id = google_user["id"],
            user_id = user.id
        )

        uuid_code = get_uuid()
        expire = c_plus_d(7)
        create_r = create_refresh_token(user.id,uuid_code)
        hash_r = sha_hash(create_r)
        create_a = create_access_token(user.id,uuid_code)
        ua_parse = user_agent_parse(user_agent)

        add_s = UserSession(
                session_id = uuid_code,
                user_id = user.id,

                r_token_hash = hash_r,

                device_type = ua_parse["device_type"],
                device_name = ua_parse["device"],
                browser = ua_parse["browser"],
                os = ua_parse["os"],

                ip_address = ip,
                user_agent = user_agent,

                expires_at = expire
            )
        try:
            db.add(add_s)
            db.add(user)
            db.add(user_auth)
            await db.commit()
            await db.refresh(user)
        except:
            await db.rollback()
            raise
        return {"user":UserModel.model_validate(user),
                "refresh":create_r,
                "access": create_a
                }
    
async def create_l_user(ip,user_agent:str,email_id:str,password:str,db:Session):
    start = perf_counter()
    query = await db.execute(select(User).where(User.email==email_id))  #db search for user exist or not
    email = query.scalar_one_or_none()
    if email:
        raise HTTPException(status_code=400,detail="Email already registered")
    t1 = perf_counter()


    
    create = User(
        email = email_id
    )

    db.add(create)
    await db.flush()

    t3 = perf_counter()


    hash_pass = await run_in_threadpool(hash_password,password)


    t4 = perf_counter()

    expiry = c_plus_d(7) # current time + given days

    ua_parsed = user_agent_parse(user_agent)
    
    uuid_code = get_uuid()

    # create auth  tokens
    access = create_access_token(create.id,uuid_code)
    refresh = create_refresh_token(create.id,uuid_code)

    hash_r = sha_hash(refresh)

    t5 = perf_counter()

    add_s = UserSession(

        session_id = uuid_code,
        user_id = create.id,

        r_token_hash = hash_r,

        device_type = ua_parsed["device_type"],
        device_name = ua_parsed["device"],
        browser = ua_parsed["browser"],
        os = ua_parsed["os"],

        ip_address = ip,
        user_agent = user_agent,
        
        expires_at = expiry
        
        )

    db.add(add_s)

    t6 = perf_counter()


    auth = UserAuth(
        provider = "local",
        user_id = create.id,
        hashed_password=hash_pass
    )

    try:
        db.add(auth)

        await db.commit()
        await db.refresh(create)
    except:
        await db.rollback()
        raise

    t7 = perf_counter()

    print(f"""
    DB query   : {(t3-t1)*1000:.2f}) ms
    Password hash  : {(t4-t3)*1000:.2f} ms
    whole parsing : {(t5-t4)*1000:.2f} ms
    session add  : {(t6-t5)*1000:.2f}
    whole db commit : {(t7-t5)*1000:.2f}
    """)

    stored_user = UserBaseModel.model_validate(create)

    return {"refresh":refresh,
            "access":access,
            "user":stored_user}

async def login_l_user(ip:str,user_agent:str,email_id:str,password:str,db:Session):
    query = await db.execute(select(User).where(User.email==email_id).options(joinedload(User.auth),joinedload(User.session)))
    store = query.unique().scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=400,detail="Wrong credentials")

    email = UserAndAuthModel.model_validate(store)

    for auth in email.auth:
        provider = None
        hashed_password = auth.hashed_password
        if auth.provider == "local":
            provider = "local"
    if not provider:
        raise HTTPException(status_code=400,detail="Wrong credentials")
    
    if not await run_in_threadpool(verify_password,password,hashed_password):
        raise HTTPException(status_code=400,detail="Wrong credentials")
    

    uuid_code = get_uuid()
    create_refresh = create_refresh_token(email.id,uuid_code)
    refresh_hash = sha_hash(create_refresh)
    ua_parse = user_agent_parse(user_agent)
    expire = c_plus_d(7)
    
    auth_s = UserSession(
        session_id = uuid_code,
        user_id = email.id,

        r_token_hash = refresh_hash,

        device_type = ua_parse["device_type"],
        device_name = ua_parse["device"],
        browser = ua_parse["browser"],
        os = ua_parse["os"],

        ip_address = ip,
        user_agent = user_agent,
        
        expires_at = expire
        
    )
    try:
        db.add(auth_s)
        await db.commit()
        create_access = create_access_token(email.id,uuid_code)
        await delete_user_session(email.id,uuid_code)
    except:
        await db.rollback()
        raise
    
    return {"user":email,
            "access":create_access,
            "refresh":create_refresh}

#change a password
async def reset_pass(user_id:int,new_password:str,current_password:str,db:Session):
    if current_password == new_password:
        raise HTTPException(status_code=400,detail="new password cannot be same as current one")

    
    query = await db.execute(select(UserAuth).where(UserAuth.user_id==user_id,UserAuth.provider=="local"))
    store = query.scalar_one_or_none()
    auth_check = UserAuthModel.model_validate(store)

    if not auth_check:
        raise HTTPException(status_code=400,detail="login with email password first")
    
    new_pass = await run_in_threadpool(hash_password,new_password)

    if not verify_password(current_password,auth_check.hashed_password):
        raise HTTPException(status_code=400,detail="incorrect current password")
    
    try:
       store.hashed_password = new_password

       await db.commit()
    except:
        await db.rollback()
        raise

    return {"successfully changed"}

# password forgotten
async def forgot_password(email:str,db:Session):
    query = await db.execute(select(UserAuth).join(User).where(User.email==email,UserAuth.provider=="local"))
    check = query.scalar_one_or_none()
    if not check:
        return {"If an account exists, we've sent you instructions"}
    
    code = gen_code()  #generate a unique code
    url_token = gen_url_token()  #generate token for the url

    set_code = forgot_pass_key(url_token,check.user_id,code)  #code is joint with

    mail = forgot_pass_mail(code,f"http://127.0.0.1:8000/auth/set_password?token={url_token}")

    return {"If an account exists, we've sent you instructions"}



async def new_password(code:str,password:str,db:Session,token:str):
    user_id = get_forgot_pass_key(token,code)
    if user_id is None:
        raise HTTPException(status_code=400,detail="Invalid or expired code")

    new_pass = hash_password(password)

    
    query = await db.execute(select(UserAuth).where(UserAuth.user_id==user_id,UserAuth.provider=="local"))
    check = query.scalar_one_or_none()
    try:

        check.hashed_password=new_pass

        await db.commit()

        redis_call = del_forgot_pass_key(token,code)
    except:
        await db.rollback()
        raise
    
    return {"Password changed successfully"}


# add password to existing google email
async def add_password(user_id:int,password:str,db:Session):

    query = await db.execute(select(UserAuth).where(UserAuth.user_id==user_id,UserAuth.provider=="local"))
    check = query.scalar_one_or_none()

    if check is not None:
        raise HTTPException(status_code=400,detail="This email has a password, to change password use forgot-password or reset password")
    
    hash_pass = await run_in_threadpool(hash_password,password)

    add_auth = UserAuth(
        user_id = user_id,
        provider = "local",
        hashed_password = hash_pass
    )
    try:
        db.add(add_auth)
        await db.commit()
    except:
        await db.rollback()
        raise
    return {"Password added successfully"}

async def get_session(user_id:int,session_id:str,db:Session):

    get_session = await get_user_session(user_id,session_id)
    if get_session:
        return get_session

    query = await db.execute(select(UserSession.last_seen,UserSession.device_type,UserSession.device_name).where(UserSession.user_id==user_id))
    store = query.all()
    if not store:
        raise HTTPException(status_code=400,detail="No session's found")

    session = [{"last_seen": row.last_seen,
               "device_type": row.device_type,
               "device_name": row.device_name
               } for row in store
               ]
    await cache_user_session(user_id,session_id,session)
    return session

async def refresh_token(token:str,db:Session):
    token = await decode_token_r(token,db)

    
    query = await db.execute(select(UserSession).where(UserSession.session_id==token["sid"]))
    store = query.scalar_one_or_none()
    get = UserSessionModel.model_validate(store)
    if get is None:
        raise HTTPException(status_code=400,detail="Session not found")
    
    redis_set = await concurrent_first_request(token["sid"])

    if redis_set == True:
        pass    
    else:
        for i in range(200):
            call_redis = await get_concurrent_r_token(token["sid"])
            if call_redis and call_redis["status"] == "done":
                return {"access":call_redis["access"],
                        "refresh":call_redis["refresh"],
                        "sub":token["sub"]
                        }
            await asyncio.sleep(0.05)
        raise HTTPException(status_code=500,detail="refresh_timedout")


    

    
    new_r = create_refresh_token(token["sub"],token["sid"])
    new_r_hash = sha_hash(new_r)
    new_a = create_access_token(token["sub"],token["sid"])

    get.r_token_hash = new_r_hash
    get.last_seen = current_time()
    get.expires_at = c_plus_d(7)
    get.created_at = current_time()
    try:
        await db.commit()
    except:
        await db.rollback()
        raise
    await concurrent_r_token(token["sid"],new_a,new_r)
    return {"refresh":new_r,
            "access":new_a,
            "sub":token["sub"]}
    
