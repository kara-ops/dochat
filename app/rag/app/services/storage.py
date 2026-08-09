from app.rag.app.models.service import Document,Chunk

async def save_documents(wk_id:int,filename:str,content:str,chunks:list[str],vector:list[list[float]],db,user)->dict:
    save_docs = Document(
        filename=filename,
        workspace_id = wk_id,
        content=content,
        user_id=user
    )
    db.add(save_docs)
    await db.commit()
    await db.refresh(save_docs)
    

    doc_id = save_docs.id
    
    for i in range(len(chunks)):

        save_chunk = Chunk(
            document_id=doc_id,
            content=chunks[i],
            embedding=vector[i],
            chunk_index=i
        )
        db.add(save_chunk)
    await db.commit()
    return {
        "id": save_docs.id,
        "filename": save_docs.filename,
        "created_at": save_docs.created_at.isoformat()
    }
        
