from app.rag.app.services.embeddings import embed_text
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy  import text
from rank_bm25 import BM25Okapi




def retrieve_chunks(wk_id:int,ques:str,db,k:int=5)->list[str]:
    embed_ques = embed_text([ques])[0]

    query = text("SELECT id,content FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = wk_id ORDER BY chunks.embedding <=> CAST(:vector AS vector) LIMIT :k")
    res = db.execute(query,{"vector":embed_ques,"k":k,"doc_id":wk_id})
    rows = res.fetchall()
    real_chunks = [{"id":row.id,"content":row.content} for row in rows]
    return real_chunks

def search_bm25(wk_id:int,db:Session,ques_query, k=20):
    query = text("SELECT id,content FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = :wk_id")
    res = db.execute(query,{"wk_id":wk_id})
    rows = res.fetchall()
    real_chunks = [row.content for row in rows]
    chunks_id = [row.id for row in rows]
    tokenize = [chunk.lower().split() for chunk in real_chunks]
    bm25 = BM25Okapi(tokenize)
    scores = bm25.get_scores(ques_query.lower().split())
    scored = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:k]
    top_chunks = [{"id": chunks_id[i], "content": real_chunks[i]} for i, score in scored]
    return top_chunks


def rrf_merge(vector_res, bm25_res, k=60, top_n=5):
    n = len(bm25_res)
    m = len(vector_res)
    chunk_id = {}
    for i in range(n):
        chunk = bm25_res[i]
        save = 1/(k+i+1)
        chunk_id[chunk["id"]]={"score":save, "content":chunk["content"]}
    for j in range(m):
        chunk = vector_res[j]
        save = 1/(k+j+1)
        if chunk["id"] in chunk_id:
            chunk_id[chunk["id"]]={"score":chunk_id[chunk["id"]]["score"]+save,"content":chunk["content"]}
        else:
            chunk_id[chunk["id"]]={"score":save,"content":chunk["content"]}
    sorting = sorted(chunk_id.items(),key=lambda pair: pair[1]["score"],reverse=True)[:top_n]
    final = [{"id": chunk_final[0], "content": chunk_final[1]["content"]}for chunk_final in sorting]
    return final

        
    
    



