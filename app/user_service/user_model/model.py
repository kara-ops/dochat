from sqlalchemy import Integer,Column,String,DateTime,func
from sqlalchemy.orm import relationship
from app.rag.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer,primary_key=True)
    email = Column(String,nullable=False,unique=True)
    hashed_password = Column(String,nullable=False)
    created_at = Column(DateTime,server_default=func.now())
    
    documents = relationship("Document", back_populates="user", cascade="all, delete")