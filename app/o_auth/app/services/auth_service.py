from sqlalchemy.orm import Session
from app.user_service.user_model.model import User,UserAuth
from fastapi import Request


def get_or_create_user(db:Session, google_user:dict)->User:
    get_user_auth = db.query(UserAuth).filter(UserAuth.provider_id==google_user["id"]).first()
    
    if not get_user_auth:
        user = User(
            name = google_user["name"],
            email = google_user["email"],
            avatar_url = google_user["picture"]
            )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        user_auth = UserAuth(
            provider  = "google",
            provider_id = google_user["id"]
        )

        db.add(user_auth)
        db.commit()
        db.refresh(user_auth)
        
        return {"user_auth":user_auth,
                "user":user}
    else:
        return {get_user_auth}
