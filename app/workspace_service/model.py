from app.core.database import Base
from sqlalchemy import Column,Integer,DateTime,func,String,ForeignKey,UniqueConstraint
from sqlalchemy.orm import relationship

class WorkSpace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer,primary_key=True)
    name = Column(String,nullable=False)
    owner_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    created_at = Column(DateTime,server_default=func.now())

    user = relationship("User",back_populates="workspace")
    document = relationship("Document",back_populates="workspace",cascade="all, delete")
    wk_member = relationship("WorkSpaceMember",back_populates="wk_id",cascade="all, delete")

class WorkSpaceMember(Base):
    __tablename__ = "workspacemembers"
    id = Column(Integer,primary_key=True)
    workspace_id = Column(Integer,ForeignKey("workspaces.id"),nullable=False)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    role = Column(String,nullable=False)#owner, admin, member, viewer
    created_at = Column(DateTime,server_default=func.now())

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_id_user_id"),
    ) 
    wk_id = relationship("WorkSpace",back_populates="wk_member")
    user = relationship("User",back_populates="wk_member")

