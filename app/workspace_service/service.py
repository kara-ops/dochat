from app.workspace_service.model import WorkSpace
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.user_service.user_model.model import User
from app.workspace_service.model import WorkSpaceMember
from app.workspace_service.schema import WorkSpaceRespond,WorkSpaceMemberRespond

def create_workspace(name:str,user_id:int,db:Session):
    create = WorkSpace(
        owner_id = user_id,
        name = name
    )
    db.add(create)
    db.flush()
    create_wk_mem = WorkSpaceMember(
        workspace_id = create.id,
        user_id = user_id,
        role = "owner"
    )
    db.add(create_wk_mem)
    db.commit()
    db.refresh(create_wk_mem)
    return [WorkSpaceRespond.model_validate(create)]

def get_wk(db:Session,user_id:int):
    get = db.query(WorkSpace).filter(WorkSpace.owner_id==user_id).all()
    return get

def delete_wk(db:Session,wk_id:int,user_id:int):
    get = db.query(WorkSpace).filter(WorkSpace.id==wk_id).first()

    if not get:
        raise HTTPException(status_code=404,detail="Workspace not found")
    
    if user_id != get.owner_id:
        raise HTTPException(
            status_code=403,detail="you are not owner of this workspace"
        )
    db.delete(get)
    db.commit()
    
    return {wk_id:"deleted"}

def invite_user(db:Session,email:str,wk_id:int,role:str):# in future will be fixed

    #check wk exists
    get_wk = db.query(WorkSpace).filter(WorkSpace.id==wk_id).first()
    if not get_wk:
        raise HTTPException(status_code=404,detail="WorkSpace not found")
    
    #check user exist
    get_user = db.query(User).filter(User.email==email).first()
    if not get_user:
        raise HTTPException(status_code=404,detail="User not found")
    
    #if user already in wk check
    get = db.query(WorkSpaceMember).filter(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id==get_user.id).first()
    if get:
        raise HTTPException(status_code=400,detail="User is already in the workspace")
    create = WorkSpaceMember(
        workspace_id=wk_id,
        user_id=get_user.id,
        role=role
    )
    db.add(create)
    db.commit()
    db.refresh(create)
    return create
    

roles = ["member","admin","viewer"]
def promote_demote(db:Session,wk_id:int,user_id:int,role:str):
    if role not in roles:
        raise HTTPException(status_code=400,detail="You can promote/demote only to these roles: ['member', 'admin', 'viewer']")
    get = db.query(WorkSpaceMember).filter(WorkSpaceMember.workspace_id==wk_id,WorkSpaceMember.user_id==user_id).first()
    if not get:
        raise HTTPException(status_code=404,detail="user/workspace not found")
    get.role = role
    db.add(get)
    db.commit()
    db.refresh(get)
    return get