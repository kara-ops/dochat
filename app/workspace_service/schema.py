from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class WorkSpace_Create(BaseModel):
    name:str

class WorkSpaceRespond(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    model_config = {"from_attributes": True}

class WorkSpaceMemberRespond(BaseModel):
    id:int
    workspace_id:int
    user_id:int
    role:str
    created_at:datetime
    model_config = {"from_attributes": True}

class WorkSpaceAndMembers(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    wk_member: list[WorkSpaceMemberRespond] 
    model_config = {"from_attributes": True}

class WorkSpaceMemberRole(str,Enum):
    ADMIN="admin"
    MEMBER="member"
    VIEWER="viewer"

class WorkSpaceMemberRequest(BaseModel):
    email:str
    role:WorkSpaceMemberRole

