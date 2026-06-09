from app.rag.app.services.embeddings import embed_text
from app.core.database import get_db
from sqlalchemy  import text
from fastapi import HTTPException



def retrieve_chunks(user_id,doc_id:int,ques:str,db,k:int=5)->list[str]:
    embed_ques = embed_text([ques])[0]

    query = text("SELECT id,content FROM chunks WHERE document_id = :doc_id ORDER BY embedding <=> CAST(:vector AS vector) LIMIT :k")
    res = db.execute(query,{"vector":embed_ques,"k":k,"doc_id":doc_id})
    rows = res.fetchall()
    real_chunks = [row.content for row in rows]
    return real_chunks


