from sqlalchemy import Integer,Column,String,DateTime,func,Boolean,ForeignKey,UniqueConstraint
from sqlalchemy.orm import relationship
from app.rag.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer,primary_key=True)
    name=Column(String,nullable=True)
    email = Column(String,nullable=False,unique=True)
    created_at = Column(DateTime,server_default=func.now())
    is_active = Column(Boolean,default=True)
    avatar_url = Column(String,nullable=True)

    user_auth = relationship("UserAuth",back_populates="user",cascade="all, delete")
    documents = relationship("Document", back_populates="user", cascade="all, delete")
class UserAuth(Base):
    __tablename__ = "user_auth"
    id = Column(Integer,primary_key=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    provider = Column(String,nullable=False)#google auth, local auth, etc
    provider_id = Column(String,nullable=True)
    hashed_password = Column(String,nullable=True)
    created_at = Column(DateTime,server_default=func.now())

    __table_args__ = (
        UniqueConstraint("provider", "provider_id", name="uq_provider_provider_id"),
    )
    
    user = relationship("User",back_populates="user_auth")
    