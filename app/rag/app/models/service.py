from sqlalchemy import Integer, Column, String,DateTime, ForeignKey, func, Text
from app.core.database import Base
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer,primary_key=True,index=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False,index=True)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete")

class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer,ForeignKey("documents.id"),nullable=False, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768))
    chunk_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    document = relationship("Document", back_populates="chunks")




