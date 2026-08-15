from app.rag.app.services.embeddings import embed_text
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy  import text
from rank_bm25 import BM25Okapi




async def retrieve_chunks(wk_id:int,ques:str,db,k:int=5)->list[str]:
    embed_ques = embed_text([ques])[0]

    query = text("SELECT chunks.id,chunks.content,chunks.chunk_index,documents.filename FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = :wk_id ORDER BY chunks.embedding <=> CAST(:vector AS vector) LIMIT :k")
    res = db.execute(query,{"vector":embed_ques,"k":k,"wk_id":wk_id})
    rows = res.fetchall()
    real_chunks = [{"id":row.id,"filename":row.filename,"chunk_index":row.chunk_index,"content":row.content} for row in rows]
    return real_chunks

# async def search_bm25(wk_id:int,db:Session,ques_query, k=20):
#     query = text("SELECT chunks.id,chunks.content,chunks.chunk_index,documents.filename FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = :wk_id")
#     res = await db.execute(query,{"wk_id":wk_id})
#     rows = res.fetchall()
#     filenames = [row.filename for row in rows]
#     chunk_index = [row.chunk_index for row in rows]
#     real_chunks = [row.content for row in rows]
#     chunks_id = [row.id for row in rows]
#     tokenize = [chunk.lower().split() for chunk in real_chunks]
#     bm25 = BM25Okapi(tokenize)
#     scores = bm25.get_scores(ques_query.lower().split())
#     scored = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:k]
#     top_chunks = [{"id": chunks_id[i],"filename":filenames[i],"chunk_index":chunk_index[i],"content": real_chunks[i]} for i, score in scored]
#     return top_chunks


# def rrf_merge(vector_res, bm25_res, k=60, top_n=5):
#     n = len(bm25_res)
#     m = len(vector_res)
#     chunk_id = {}
#     for i in range(n):
#         chunk = bm25_res[i]
#         save = 1/(k+i+1)
#         chunk_id[chunk["id"]]={"score":save, "content":chunk["content"], "filename":chunk["filename"], "chunk_index":chunk["chunk_index"]}
#     for j in range(m):
#         chunk = vector_res[j]
#         save = 1/(k+j+1)
#         if chunk["id"] in chunk_id:
#             chunk_id[chunk["id"]]={"score":chunk_id[chunk["id"]]["score"]+save,"content":chunk["content"], "filename":chunk["filename"], "chunk_index":chunk["chunk_index"]}
#         else:
#             chunk_id[chunk["id"]]={"score":save,"content":chunk["content"], "filename":chunk["filename"], "chunk_index":chunk["chunk_index"]}
#     sorting = sorted(chunk_id.items(),key=lambda pair: pair[1]["score"],reverse=True)[:top_n]
#     final = [{"id": chunk_final[0], "content": chunk_final[1]["content"], "filename":chunk_final[1]["filename"], "chunk_index":chunk_final[1]["chunk_index"]}for chunk_final in sorting]
#     return final

# async def hybrid_search(db:Session,wk_id:int,question:str):
#     vector_s = await retrieve_chunks(wk_id,question,db)
#     bm25_s = await search_bm25(wk_id,db,question)
#     return rrf_merge(vector_s,bm25_s)

        
    
    



