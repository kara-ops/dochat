from app.rag.rag_app.services.embeddings import embed_text
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy  import text

import json


async def ques_embed(ques:str):
    return json.dumps((await embed_text([str(ques)]))[0])

async def retrieve_chunks(wk_id:int,embed_ques:str,db:AsyncSession,k:int=5)->list[str]:

    query = text("SELECT chunks.id,chunks.content,chunks.chunk_index,documents.filename FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = :wk_id ORDER BY chunks.embedding <=> CAST(:vector AS vector) LIMIT :k")
    res = await db.execute(query,{"vector":vector_que,"k":k,"wk_id":wk_id})
    rows = res.fetchall()
    real_chunks = [{"id":row.id,"filename":row.filename,"chunk_index":row.chunk_index,"content":row.content} for row in rows]
    return real_chunks

def hybrid_search(wk_id:int, embed_ques:str, db:AsyncSession,top_n: int=5, k: int=20)->list[dict]:
    query = text("""
        WITH vector_results AS (
            SELECT 
                chunks.id,
                chunks.content,
                chunks.chunk_index,
                documents.filename,
                ROW_NUMBER() OVER (ORDER BY chunks.embedding <=>
    CAST(:vector AS vector)) AS rank
            FROM chunks
            JOIN documents ON chunks.document_id = documents.id
            WHERE documents.workspace_id = :wk_id
            LIMIT :k
        ),
    """)
    

    
  
    



