from fastapi import APIRouter, Depends, UploadFile, Request, File
from sqlalchemy.orm import Session

from app.core.database import get_db

import os
import shutil


from app.oauth.app.core.dependencies import get_current_user

from app.user_service.user_model.model import User
from app.user_service.user import get_docs

from app.workspace_service.model import WorkSpaceMember
from app.workspace_service.dependency import require_role

from app.rag.rag_app.tasks.ingesion_task import ingest_doc_task
from app.rag.rag_app.services.ingestion import ingest_pdf
from app.celery_app import celery_app




#file path fixed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))



router = APIRouter(prefix="/rag")

@router.post("/workspaces/{wk_id}/documents/upload")
async def upload_docs( req:Request,wk_id:int, file: UploadFile = File(...), db:Session=Depends(get_db), current_user: User = Depends(get_current_user), mem:WorkSpaceMember=Depends(require_role("member"))):

#save the file and create a path
    upload_dir = os.path.join(BASE_DIR,"temp")
    file_path = os.path.join(upload_dir,file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file,buffer)
    
#calling service function to ingest
    task = ingest_doc_task.delay(wk_id,file_path,current_user["user"].id)
    
    return {"task_id": task.id,"status":"processing"}

@router.get("/task/{task_id}")
async def get_task_status(task_id:str):
    task  = celery_app.AsyncResult(task_id)
    return {"task_id":task_id,"status":task.status}

@router.get("/documents")
async def get_doc_id(db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    return await get_docs(db,current_user["user"].id)
     
