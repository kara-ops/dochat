from sqlalchemy import Integer,Column,String,DateTime,func,Boolean,ForeignKey,UniqueConstraint,UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer,primary_key=True)
    name=Column(String,nullable=True)
    email = Column(String,nullable=False,unique=True)
    created_at = Column(DateTime,server_default=func.now())
    is_active = Column(Boolean,default=True)
    avatar_url = Column(String,nullable=True)
    
    workspace = relationship("WorkSpace",back_populates="user",cascade="all, delete")
    user_auth = relationship("UserAuth",back_populates="user",cascade="all, delete")
    documents = relationship("Document", back_populates="user", cascade="all, delete")
    wk_member = relationship("WorkSpaceMember",back_populates="user")
    session   = relationship("UserSession",back_populates="user",cascade="all, delete")

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

class UserSession(Base):
    __tablename__ = "user_session"
    id = Column(Integer,primary_key=True,nullable=False)
    session_id = Column(UUID,unique=True,nullable=False)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False,index=True)

    r_token_hash = Column(String(64),nullable=False)
    revoked_at = Column(DateTime,nullable=True)

    device_type = Column(String)
    device_name = Column(String)
    browser = Column(String)
    os = Column(String)

    ip_address = Column(String,nullable=False)
    user_agent = Column(String)

    created_at = Column(DateTime,server_default=func.now(),nullable=False)
    expires_at = Column(DateTime(timezone=True),nullable=False,index=True)
    last_seen = Column(DateTime(timezone=True),server_default=func.now(),nullable=False)

    user = relationship("User",back_populates="session")
    