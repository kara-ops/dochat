from sqlalchemy.orm import Session
from app.rag.app.models.service import Document
from app.user_service.user_model.model import User,UserAuth
from fastapi import HTTPException
from app.security.auth import hash_password,verify_password
from app.security.jwt_handler import create_access_token,decode_token,create_refresh_token
from app.user_service.schema.user_schema import RefreshRequest


def create_user(email:str, password:str,db:Session):
    email_db = db.query(User).filter(User.email==email).first()
    if email_db:
        raise HTTPException(status_code=400,detail="Email already registered")
    
    hash_pass = hash_password(password)
    user = User(
        email=email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_auth = UserAuth(
        user_id = user.id,
        provider = "local",
        hashed_password = hash_pass
    )
    db.add(user_auth)
    db.commit()
    db.refresh(user_auth)

    return user


def user_login(email:str, password:str, db:Session):
    email_db = db.query(User).filter(User.email==email).first()
    if not email_db:
        raise HTTPException(status_code=401,detail="Wrong Credentials")
    hashed_pass = db.query(UserAuth).filter(UserAuth.provider == "local",UserAuth.user_id==email_db.id).first()
    if hashed_pass == None:
        raise HTTPException(
            status_code = 400,detail="this account uses Google login"
        )
    elif hashed_pass.hashed_password == None:
        raise HTTPException(
            status_code = 400, detail="this account users Google login"
        )
    check_pass = verify_password(password,hashed_pass.hashed_password)
    if not check_pass:
        raise HTTPException(status_code=401,detail="Wrong Credentials")
    
    a_token = create_access_token({"sub":str(email_db.id),
                                   "email":str(email_db.email),
                                   "type":"access"})
    r_token  = create_refresh_token({"sub":str(email_db.id),
                                     "email":str(email_db.email),
                                     "type":"refresh"})
    return {"access_token":a_token,
            "refresh_token":r_token}

#get all the docs a user has
def get_docs(db:Session,user_id:int):
    query = db.query(Document).filter(Document.user_id==user_id).all()
    if not query:
        raise HTTPException(status_code=404,detail="No doc found")
    else:
        return [{"filename":doc.filename,"doc_id":doc.id}
                for doc in query
            ]
    
def refresh_token(token:str):
    decode = decode_token(token)
    if decode == decode["type"] != "refresh":
        raise HTTPException(status_code=401,detail="Invalid token type")
    a_token = create_access_token({"sub":decode["sub"],
                                   "email":decode["email"],
                                   "type":"access"})
    r_token = create_refresh_token({"sub":decode["sub"],
                                    "email":decode["email"],
                                    "type":"refresh"})
    return {"access_token":a_token,
            "refresh_token":r_token}