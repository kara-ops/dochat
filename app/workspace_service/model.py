from app.core.database import Base
from sqlalchemy import Column,Integer,DateTime,func,String,ForeignKey
from sqlalchemy.orm import relationship

class WorkSpace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer,primary_key=True)
    name = Column(String,nullable=False)
    owner_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    created_at = Column(DateTime,server_default=func.now())

    user = relationship("User",back_populates="workspace")
    document = relationship("Document",back_populates="workspace",cascade="all, delete")
