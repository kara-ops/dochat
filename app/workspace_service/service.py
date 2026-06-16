from app.workspace_service.model import WorkSpace
from sqlalchemy.orm import Session
from fastapi import HTTPException
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

