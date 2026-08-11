from app.workspace_service.model import WorkSpace

from sqlalchemy.ext.asyncio import AsyncSession as Session
from sqlalchemy import select

from fastapi import HTTPException
from app.user_service.user_model.model import User
from app.workspace_service.model import WorkSpaceMember
from app.workspace_service.schema import WorkSpaceRespond,WorkSpaceMemberRespond

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
    await db.commit()
    await db.refresh(create_wk_mem)
    return WorkSpaceRespond.model_validate(create)

async def get_wk(db:Session,user_id:int):
    rows = await db.execute(select(WorkSpace).join(WorkSpaceMember, WorkSpaceMember.workspace_id == WorkSpace.id).filter(WorkSpaceMember.user_id == user_id).all())
    result = []
    for workspace in rows:
        result.append({
            "id": workspace.id,
            "name": workspace.name,
            "owner_id": workspace.owner_id,
            "created_at": workspace.created_at,
            "members": [
                {
                    "id": member.id,
                    "workspace_id": member.workspace_id,
                    "user_id": member.user_id,
                    "role": member.role,
                    "created_at": member.created_at,
                }
                for member in workspace.wk_member
            ],
        })
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
    await db.delete(get)
    await db.commit()
    
    return "Workspace will be deleted"

async def invite_user(db:Session,email:str,wk_id:int,role:str):# in future will be fixed

    #check wk exists,    #check user exist
    check = await db.execute(select(WorkSpace,User).where(WorkSpace.id==wk_id,User.email==email))
    query = check.first()
    if query:
        return "User Invited"

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
    await db.commit()
    await db.refresh(create)
    return "User Invited"
    

roles = ["member","admin","viewer"]
async def promote_demote(db:Session,wk_id:int,user_id:int,role:str):
    if role not in roles:
        raise HTTPException(status_code=400,detail="You can promote/demote only to these roles: ['member', 'admin', 'viewer']")
    
    check = await db.execute(select(WorkSpaceMember).filter(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id==user_id).first())

    get = check.scalar_one_or_none()

    if not get:
        raise HTTPException(status_code=404,detail="User will be Promoted/Demoted")
    
    get.role = role
    db.add(get)
    await db.commit()
    await db.refresh(get)
    return "User will be Promoted/Demoted"