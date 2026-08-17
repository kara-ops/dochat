from celery import shared_task
from app.rag.rag_app.services.ingestion import ingest_pdf
from app.core.database import AsyncSessionLocal
import asyncio

@shared_task
def ingest_doc_task(wk_id:int,file_path: str, user_id: int):
    return asyncio.run(
        run_ingestion(wk_id,file_path,user_id)
        )

async def run_ingestion(wk_id:int,file_path:str,user_id:int):
    async with AsyncSessionLocal() as db:
        return await ingest_pdf(wk_id,file_path,db,user_id)


