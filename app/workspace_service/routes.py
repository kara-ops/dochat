from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.workspace_service.schema import WorkSpace_Create
from app.workspace_service.model import WorkSpaceMember
from app.security.dependency import get_current_user,require_role
from app.user_service.user_model.model import User
from app.workspace_service.service import create_workspace,get_wk,delete_wk,invite_user
from app.workspace_service.schema import WorkSpaceMemberRequest
from app.core.database import get_db
router = APIRouter(prefix="/rag", tags=["WORKSPACE"])

@router.post("/workspaces")
def create_wks(request:WorkSpace_Create,user:dict=Depends(get_current_user),db:Session=Depends(get_db)):
    create = create_workspace(request.name,user.id,db)
    return create

@router.get("/myWorkspace")
def get_wks(db:Session=Depends(get_db),user:dict=Depends(get_current_user)):
    get = get_wk(db,user.id)
    return get

@router.delete("/workspace/{wk_id}")
def del_wk(wk_id:int,db:Session=Depends(get_db),user:dict=Depends(get_current_user),mem:WorkSpaceMember=Depends(require_role("owner"))):
    get = delete_wk(db,wk_id,user.id)
    return get
    
@router.post("/workspace/{wk_id}/invite")
def invite_in_wk(req:WorkSpaceMemberRequest,wk_id:int,db:Session=Depends(get_db),user:dict=Depends(get_current_user),mem:WorkSpaceMember=Depends(require_role("admin"))):
    create = invite_user(db,req.email,wk_id,req.role)
    return create



            

               
