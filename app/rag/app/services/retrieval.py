from app.rag.app.services.embeddings import embed_text
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy  import text
from rank_bm25 import BM250kapi



def retrieve_chunks(wk_id:int,ques:str,db,k:int=5)->list[str]:
    embed_ques = embed_text([ques])[0]

    query = text("SELECT id,content FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = wk_id ORDER BY chunks.embedding <=> CAST(:vector AS vector) LIMIT :k")
    res = db.execute(query,{"vector":embed_ques,"k":k,"doc_id":wk_id})
    rows = res.fetchall()
    real_chunks = [{"id":row.id,"content":row.content} for row in rows]
    return real_chunks


def search_bm25(wk_id:int,db:Session,ques_query, k=20):
    query = text("SELECT id,content FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = :wk_id")
    res = db.execute({"wk_id":wk_id})
    rows = res.fetchall()
    real_chunks = [row.content for row in rows]
    chunks_id = [row.id for row in rows]
    tokenize = [chunk.lower().split() for chunk in real_chunks]
    bm25 = BM250kapi(tokenize)
    scores = bm25.get_scores(ques_query.lower().split())




