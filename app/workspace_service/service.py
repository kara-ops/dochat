from app.workspace_service.model import WorkSpace
from sqlalchemy.orm import Session
from fastapi import HTTPException

def create_workspace(name:str,user_id:int,db:Session):
    create = WorkSpace(
        owner_id = user_id,
        name = name
    )
    db.add(create)
    db.commit()
    db.refresh(create)
    return create

def get_wk(db:Session,user_id:int):
    get = db.query(WorkSpace).filter(WorkSpace.owner_id==user_id).all()
    if not get:
        raise HTTPException(status_code=404,detail="no workspace found")
    return get