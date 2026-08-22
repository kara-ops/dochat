from app.rag.rag_app.services.embeddings import embed_text
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy  import text

import json


async def ques_embed(ques:str):
    return json.dumps((await embed_text([str(ques)]))[0])



async def retrieve_chunks(wk_id:int,embed_ques:str,db:AsyncSession,k:int=5)->list[str]:

    query = text("SELECT chunks.id,chunks.content,chunks.chunk_index,documents.filename FROM chunks JOIN documents ON chunks.document_id=documents.id WHERE documents.workspace_id = :wk_id ORDER BY chunks.embedding <=> CAST(:vector AS vector) LIMIT :k")
    res = await db.execute(query,{"vector":embed_ques,"k":k,"wk_id":wk_id})
    rows = res.fetchall()
    real_chunks = [{"id":row.id,"filename":row.filename,"chunk_index":row.chunk_index,"content":row.content} for row in rows]
    return real_chunks

async def hybrid_search(wk_id:int,ques:str, db:AsyncSession,top_n: int=5, k: int=20)->list[dict]:
    embed_ques = await ques_embed(ques)
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
        ),bm25_results AS(
            SELECT
                chunks.id,
                chunks.content,
                chunks.chunk_index,
                documents.filename,
                ROW_NUMBER() OVER (ORDER BY paradedb.score(chunks.id) DESC)
        AS rank
            FROM chunks
            JOIN documents ON chunks.document_id = documents.id
            WHERE chunks.id @@@ paradedb.match('content', :question)
                AND documents.workspace_id = :wk_id
            LIMIT :k
        ),rrf AS (
                SELECT 
                COALESCE(v.id, b.id)                   AS id,
                COALESCE(v.content, b.content)         AS content,
                COALESCE(v.filename, b.filename)       AS filename,
                COALESCE(v.chunk_index, b.chunk_index) AS chunk_index,
                COALESCE(1.0 / (60 + v.rank), 0)
                + COALESCE(1.0 / (60 + b.rank),0)      AS rrf_score
            FROM vector_results v 
            FULL OUTER JOIN bm25_results b ON v.id = b.id
        )
        SELECT id, content, chunk_index, filename, rrf_score
        FROM rrf
        ORDER BY rrf_score DESC
        LIMIT :top_n
    """)

    res = await db.execute(query,{"wk_id":wk_id,"top_n":top_n,"k":k,"vector":embed_ques,"question":ques})
    rows = res.fetchall()
    return [{"id":row.id,"content":row.content,"chunk_index":row.chunk_index,"filename":row.filename,"rrf_score":row.rrf_score} for row in rows]
    

    
  
    



