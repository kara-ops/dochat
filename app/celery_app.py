from app.core.config import settings
from celery import Celery
from app.core import models
celery_app = Celery(
    "rag_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.rag.rag_app.tasks.ingesion_task"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    worker_concurrency=1,
    worker_pool="solo"
)
