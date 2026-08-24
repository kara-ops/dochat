from pydantic_settings import BaseSettings,SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL:str
    REDIS_URL:str

    GEMINI_API_KEY:str
    GROQ_API_KEY:str
    
    SECRET_KEY:str
    ALGORITHM:str
    ACCESS_TOKEN_EXPIRE_MINUTES:int
    REFRESH_TOKEN_EXPIRE_DAYS:int

    GOOGLE_CLIENT_ID:str
    GOOGLE_SECRET:str
    GOOGLE_REDIRECT_URI:str

    RESEND_API_KEY:str = "onboarding@resend.dev"

    VOYGERAI_API_KEY:str


    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        extra="ignore"
    )



def get_settings()-> Settings:
    return Settings()

settings = get_settings()