from pydantic import BaseModel

class TokenResponse(BaseModel):
    access_token : str
    refresh_token : str 
    token_type  : str

class RefreshRequest(BaseModel):
    refresh_token : str

class UserPublic(BaseModel):
    id : int
    email : str
    name : str
    class Config:
        from_attributes = True



