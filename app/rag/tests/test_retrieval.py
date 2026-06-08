from app.services.retrieval import retrieve_chunks
from app.core.database import get_db

db = next(get_db())

question = "what is a bad habit"
chunks = retrieve_chunks(3,question,db,3)

for i, chunk in enumerate(chunks):
    print(f"\n--- Chunk {i+1} ---")
    print(chunk)