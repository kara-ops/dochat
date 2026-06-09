import pymupdf as pdf
from app.rag.app.services.chunker import chunk_text
from app.rag.app.services.embeddings import embed_text
from app.rag.app.services.storage import save_documents
from app.core.database import get_db
import os
from sqlalchemy.orm import Session
from app.core.logger import logger




def ingest_pdf(file_path:str,db:Session,user_id):
    #vars
    file_name = os.path.basename(file_path)
    doc = pdf.open(file_path)
    text = ""
    
    #fetching text from pdf
    for page in doc:
        text += page.get_text()
        
    if not text.strip():
        raise ValueError("No text found in pdf")
        
    chunks = chunk_text(text)#chunking 

    embedding = embed_text(chunks)#getting vectors

    
    save_document = save_documents(file_name,text,chunks,embedding,db,user_id)#saving all in db

    
    
    logger.info(
        "document_ingested",
        user_id=user_id,
        filename=file_name,
        chunks_created=len(chunks)
      )

    return save_document
        



    
    
    