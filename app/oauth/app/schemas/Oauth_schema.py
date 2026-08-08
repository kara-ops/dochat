from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class TokenResponse(BaseModel):
    access_token : str
    token_type  : str

class RefreshRequest(BaseModel):
    refresh_token : str

class UserLogin(BaseModel):
    email : str
    password : str

class UserPublic(BaseModel):
    id : int
    email : str
    name : Optional[str] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    class Config:
        from_attributes = True





class UserAuthModel(BaseModel):
    id : int
    user_id : int 
    provider : str
    provider_id : str | None
    hashed_password : str | None
    created_at : datetime

    model_config = {"from_attributes":True}

class UserSessionModel(BaseModel):
    id : int
    user_id : int
    session_id : UUID

    r_token_hash : str
    revoked_at : datetime | None
    
    device_name : str | None
    device_type : str | None
    browser : str | None
    os : str | None

    ip_address : str
    user_agent : str

    created_at : datetime
    expires_at : datetime
    last_seen : datetime    

    model_config = {"from_attributes":True}

class UserModel(BaseModel):
    id : int
    email : str
    name : str | None
    is_active : bool
    created_at : datetime
    avatar_url : str | None

    auth : list[UserAuthModel] | None
    session : list[UserSessionModel] | None

    model_config = {"from_attributes":True}

class UserAndAuthModel(BaseModel):
    id : int 
    email : str
    name : str | None
    is_active : bool
    created_at : datetime
    avatar_url : str | None

    auth : list[UserAuthModel] | None

    model_config = {"from_attributes":True}

UserAuthModel.model_rebuild()
UserSessionModel.model_rebuild()
UserModel.model_rebuild()

class UserBaseModel(BaseModel):
    id : int
    email : str
    name : str | None
    is_active : bool
    created_at : datetime
    avatar_url : str | None

    model_config = {"from_attributes":True}







class ResetPassword(BaseModel):
    current_password : str
    new_password : str

class ForgotPass(BaseModel):
    email : str

class SetPassword(BaseModel):
    code : str
    new_password : str

class AddPassword(BaseModel):
    new_password : str

class GetSession(BaseModel):
    last_seen : list[datetime] | None
    device_type : list[str] | None
    device_name : list[str] | None




