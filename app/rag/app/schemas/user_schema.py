from pydantic import BaseModel

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email:str
    password:str

class TokenResponse(BaseModel):
    token_type: str
    access_token: str