from fastapi import APIRouter,Depends,HTTPException,Request
from sqlalchemy.ext.asyncio import AsyncSession as Session
from fastapi.responses import StreamingResponse
import time

from app.core.database import get_db
from app.core.logger import logger

from app.user_service.user_model.model import User

from app.workspace_service.model import WorkSpaceMember
from app.workspace_service.dependency import require_role

from app.oauth.app.core.dependencies import get_current_user

from app.rag.app.models.service import Document
from app.rag.app.services.cache_service import get_cache,set_cache
from app.rag.app.services.retrieval import retrieve_chunks
from app.rag.app.services.llm_ans import generate_ans
from app.rag.app.schemas.query_schema import QueryRequest

router = APIRouter(prefix="/rag")

@router.post("/query")
async def query(request:Request,req:QueryRequest,db:Session=Depends(get_db),current_user:User=Depends(get_current_user),wk:WorkSpaceMember=Depends(require_role("member"))):
    start = time.time()
    
    cache_key = f"{current_user.id}:{req.document_id}:{req.question.strip().lower()}"
    cache_check = await get_cache(cache_key)
    if cache_check:
        return {"answer":cache_check,
                 "source":"cached"}


    #check if a user has that doc they asked for
    query = await db.select(Document).where(Document.id==req.document_id,Document.user_id==current_user.id)
    document = query.scalars_one_or_none()
    if not document:
        raise HTTPException(status_code=403,detail="Document not found")

    #retrival of chunks
    retrieve_context = await retrieve_chunks(current_user.id,req.document_id,req.question,db)
    #No content found in the chunks
    if not retrieve_context:
        raise HTTPException(status_code=404,detail="No information found in the document")
    

    def stream_and_cache():
        full_ans = []
        for token in generate_ans(req.question,retrieve_context):
            full_ans.append(token)
            yield token.encode("utf-8")

        latency = time.time() - start
        logger.info("query_completed",
                user_id=current_user.id,
                document_id=req.document_id,
                question=req.question[:50],
                letency_ms=round(latency*1000,2)
                )
    
        try:
            final_ans="".join(full_ans)
            set_cache(cache_key,final_ans)
        except Exception as e:
            print("CACHE ERROR:",e)

    return StreamingResponse(stream_and_cache(),media_type="text/plain")