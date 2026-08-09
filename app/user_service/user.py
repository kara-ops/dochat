from sqlalchemy.orm import Session
from app.rag.app.models.service import Document
from app.user_service.user_model.model import User,UserAuth
from fastapi import HTTPException

from app.user_service.schema.user_schema import RefreshRequest


#get all the docs a user has
def get_docs(db:Session,user_id:int):
    query = db.query(Document).filter(Document.user_id==user_id).all()
    if not query:
        raise HTTPException(status_code=404,detail="No doc found")
    else:
        return [{"filename":doc.filename,"doc_id":doc.id}
                for doc in query
            ]
