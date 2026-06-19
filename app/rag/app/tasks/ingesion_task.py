from celery import shared_task
from app.rag.app.services.ingestion import ingest_pdf
from app.core.database import get_db
@shared_task
def ingest_doc_task(wk_id:int,file_path: str, user_id: int):
    db=next(get_db())
    try:
        return ingest_pdf(wk_id,file_path,db,user_id)
    finally:
        db.close()