from fastapi import Depends, APIRouter
from app.core.dependencies import get_current_user
from app.schemas.Oauth_schema import UserPublic


router = APIRouter(prefix = "/users", tags=["users"])



@router.get("/me", response_model = UserPublic)
def user_info(current_user = Depends(get_current_user)):
    return current_user