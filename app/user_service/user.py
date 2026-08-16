from sqlalchemy.ext.asyncio import AsyncSession as Session
from app.rag.app.models.service import Document
from app.user_service.user_model.model import User,UserAuth
from fastapi import HTTPException

from app.user_service.schema.user_schema import RefreshRequest

from sqlalchemy import select 


#get all the docs a user has
async def get_docs(db:Session,user_id:int):
    check = await db.execute(select(Document).where(Document.user_id==user_id))
    query = check.scalars().all()
    if not query:
        raise HTTPException(status_code=404,detail="No document found")
    else:
        return [{"filename":doc.filename,"doc_id":doc.id}
                for doc in query
            ]
