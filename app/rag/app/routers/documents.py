from fastapi import APIRouter, Depends, UploadFile, Request, File
from sqlalchemy.orm import Session
from app.core.database import get_db
import os
import shutil
from app.rag.app.services.ingestion import ingest_pdf
from app.security.dependency import get_current_user,require_role
from app.user_service.user_model.model import User
from app.workspace_service.model import WorkSpaceMember
from app.security.rate_limit import upload_limit
from app.rag.app.tasks.ingesion_task import ingest_doc_task
from app.rag.celery_app import celery_app
from app.user_service.user import get_docs
import os 


#file path fixed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))



router = APIRouter(prefix="/rag")

@router.post("/workspaces/{wk_id}/documents/upload")
async def upload_docs(wk_id:int, file: UploadFile = File(...), req:Request = None, db:Session=Depends(get_db), current_user: User = Depends(get_current_user), mem:WorkSpaceMember=Depends(require_role("member"))):
    # fetch user ip
    x_forwarded_for = req.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for[0].strip()
    else:
        ip = req.client.host
    upload_limit(ip)
#save the file and create a path
    upload_dir = os.path.join(BASE_DIR,"temp")
    file_path = os.path.join(upload_dir,file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file,buffer)
    
#calling service function to ingest
    task = ingest_doc_task.delay(wk_id,file_path,current_user.id)
    
    return {"task_id": task.id,"status":"processing"}

@router.get("/task/{task_id}")
def get_task_status(task_id:str):
    task  = celery_app.AsyncResult(task_id)
    return {"task_id":task_id,"status":task.status}

@router.get("/documents")
def get_doc_id(db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    return get_docs(db,current_user.id)
     
