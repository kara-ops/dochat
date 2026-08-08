from sqlalchemy.ext.asyncio import create_async_engine,AsyncSession
from sqlalchemy.orm import sessionmaker,declarative_base
from app.core.config import settings
import redis.asyncio as redis


engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=20, max_overflow=20, pool_timeout=30)
AsyncSessionlocal = sessionmaker(bind=engine, class_=AsyncSession, autoflush = False, autocommit = False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionlocal() as session:
        yield session


redis_client = redis.Redis(host="localhost", port=6379, decode_responses = True)

def get_redis():
    return redis_client