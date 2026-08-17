from pydantic import BaseModel

class QueryRequest(BaseModel):
    question: str
    document_id: int

