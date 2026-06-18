import pymupdf as pdf
from fastapi import HTTPException
from docx import Document
from app.rag.app.services.chunker import chunk_text
from app.rag.app.services.embeddings import embed_text
from app.rag.app.services.storage import save_documents
from app.core.database import get_db
import os
from sqlalchemy.orm import Session
from app.core.logger import logger
from pathlib import Path




def ingest_pdf(file_path:str,db:Session,user_id):
    #vars
    file_type = [".pdf",".docx",".txt"]
    text = ""
    ext = Path(file_path).suffix.lower()

    if ext not in file_type:
        raise HTTPException(status_code=400,detail="We only accept these ['.pdf','.docx','.txt'] file types")
    if ext == ".pdf":
        doc = pdf.open(file_path)
        for page in doc:
            text += page.get_text()
    elif ext == ".docx":
        doc = Document(file_path)
        text = "\n".join(p.text for p in doc.paragraphs)
    else:#txt
        with open(file_path,"r",encoding="utf-8") as f:
            text = f.read()

    
    file_name = os.path.basename(file_path)

        
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
        



    
    
    