from app.oauth.app.core.dependencies import get_current_user

from sqlalchemy.ext.asyncio import AsyncSession as Session

from fastapi import Depends,HTTPException

from sqlalchemy import select

from app.workspace_service.model import WorkSpaceMember

from app.user_service.user_model.model import User

from app.core.database import get_db

from app.workspace_service.cache_service import cache_my_role,get_my_cached_role


role_h = {"owner":4,
          "admin":3,
          "member":2,
          "viewer":1
        }
def require_role(role:str):
    async def checker(wk_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
        # get_role = await get_my_cached_role(wk_id,user["user"].id)
        # if get_role:
        #     if role_h[get_role] >= role_h[role]:
        #         return checker
        #     raise HTTPException(status_code=403,detail="Not Allowed puh")
            
        query = await db.execute(select(WorkSpaceMember).where(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id==user["user"].id))
        check = query.scalar_one_or_none()

        if not check:
            raise HTTPException(status_code=403,detail="Not Allowed")

        await cache_my_role(check.role,user["user"].id,wk_id)

        if role_h[check.role] >= role_h[role]:
            return checker
        raise HTTPException(status_code=403,detail="Not Allowed gay")     
    return checker   

