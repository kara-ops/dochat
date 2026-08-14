from app.workspace_service.model import WorkSpace

from sqlalchemy.ext.asyncio import AsyncSession as Session
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from fastapi import HTTPException
from app.user_service.user_model.model import User
from app.workspace_service.model import WorkSpaceMember
from app.workspace_service.schema import WorkSpaceRespond,WorkSpaceMemberRespond,WorkSpaceAndMembers

from app.workspace_service.cache_service import delete_my_cached_role

async def create_workspace(name:str,user_id:int,db:Session):
    create = WorkSpace(
        owner_id = user_id,
        name = name
    )
    db.add(create)
    await db.flush()
    create_wk_mem = WorkSpaceMember(
        workspace_id = create.id,
        user_id = user_id,
        role = "owner"
    )
    db.add(create_wk_mem)
    try:
        await db.commit()
    except:
        await db.rollback()
    await db.refresh(create)
    return WorkSpaceRespond.model_validate(create)

async def get_wk(db:Session,user_id:int):
    query = await db.execute(select(WorkSpace).where(WorkSpace.owner_id == user_id).options(joinedload(WorkSpace.wk_member)))
    check = query.unique().scalars().all()
    result = [
        WorkSpaceAndMembers.model_validate(workspace)
        for workspace in check
    ]

    return result

async def delete_wk(db:Session,wk_id:int,user_id:int):
    check = await db.execute(select(WorkSpace).filter(WorkSpace.id==wk_id))
    get = check.scalar_one_or_none()

    if not get:
        raise HTTPException(status_code=404,detail="Workspace will be deleted")
    
    if user_id != get.owner_id:
        raise HTTPException(
            status_code=403,detail="you are not owner of this workspace"
        )
    try:
        await db.delete(get)
        await db.commit()
    except:
        await db.rollback()
    
    
    return "Workspace will be deleted"

async def invite_user(db:Session,email:str,wk_id:int,role:str):# in future will be fixed

    #check wk exists,    #check user exist
    check = await db.execute(select(WorkSpace,User).where(WorkSpace.id==wk_id,User.email==email))
    query = check.first()
    if not query:
        return "User will be Invited"

    wk,user = query
    
    #if user already in wk check
    query = await db.execute(select(WorkSpaceMember).where(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id==user.id))
    get = query.scalar_one_or_none()

    if get:
        raise HTTPException(status_code=400,detail="User is already in the workspace")
    
    create = WorkSpaceMember(
        workspace_id=wk_id,
        user_id=user.id,
        role=role
    )
    db.add(create)
    try:
        await db.commit()
    except:
        db.rollback()
        raise
    return "User will be Invited"
    

roles = ["member","admin","viewer"]
async def promote_demote(db:Session,wk_id:int,user_id:int,role:str):
    if role not in roles:
        raise HTTPException(status_code=400,detail="You can promote/demote only to these roles: ['member', 'admin', 'viewer']")
    
    check = await db.execute(select(WorkSpaceMember).filter(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id==user_id))

    get = check.scalar_one_or_none()

    if not get:
        raise HTTPException(status_code=403,detail="User will be Promoted/Demoted")
    
    get.role = role
    db.add(get)
    try:
        await db.commit()
    except:
        await db.rollback()
        raise
    await delete_my_cached_role(wk_id,user_id)
    return "User will be Promoted/Demoted"