from app.rag.rag_app.models.service import Document,Chunk
from app.rag.rag_app.schemas.user_schema import DocumentModel

async def save_documents(wk_id:int,filename:str,content:str,chunks:list[str],vector:list[list[float]],db,user)->dict:
    save_docs = Document(
        filename=filename,
        workspace_id = wk_id,
        content=content,
        user_id=user
    )
    db.add(save_docs)
    await db.flush()
    await db.refresh(save_docs)
    

    doc_id = DocumentModel.model_validate(save_docs)
    
    for i in range(len(chunks)):

        save_chunk = Chunk(
            document_id=doc_id.id,
            content=chunks[i],
            embedding=vector[i],
            chunk_index=i
        )
        db.add(save_chunk)
    try:
        await db.commit()
    except:
        await db.rollback()
        raise 
    return {
        "id": doc_id.id,
        "filename": doc_id.filename,
        "created_at": doc_id.created_at
    }
        
