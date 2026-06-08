from app.core.config import settings
import httpx
from app.models.user_model import User

async def exchange_code_for_token(code:str) -> str:
    async with httpx.AsyncClient() as client:
        payload = {
            "code" : code,
            "client_id":settings.GOOGLE_CLIENT_ID,
            "client_secret":settings.GOOGLE_SECRET,
            "redirect_uri":settings.GOOGLE_REDIRECT_URI,
            "grant_type":"authorization_code",
        }
       
        response = await client.post("https://oauth2.googleapis.com/token", data = payload)
        print("google response:",response.json())
        response.raise_for_status()
        return response.json()["access_token"]
    
async def get_google_user(access_token:str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers = {
            "Authorization" : f"Bearer {access_token}"
        })
        response.raise_for_status()
        return response.json()
