from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.workspace_service.schema import WorkSpace_Create
from app.security.dependency import get_current_user
from app.user_service.user_model.model import User
from app.workspace_service.service import create_workspace,get_wk
from app.core.database import get_db
router = APIRouter(prefix="/rag", tags=["WORKSPACE"])

@router.post("/workspaces")
def create_wks(request:WorkSpace_Create,user:dict=Depends(get_current_user),db:Session=Depends(get_db)):
    create = create_workspace(request.name,user.id,db)
    return create

@router.get("/myWorkspace")
def get_wks(db:Session=Depends(get_db),user:dict=Depends(get_current_user)):

            

               
