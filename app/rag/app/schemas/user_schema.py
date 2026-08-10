from pydantic import BaseModel
from datetime import datetime
class TokenResponse(BaseModel):
    token_type: str
    access_token: str


class DocumentModel(BaseModel):
    id : int
    user_id : int
    workspace_id : int
    filename : str
    content : str
    created_at : datetime