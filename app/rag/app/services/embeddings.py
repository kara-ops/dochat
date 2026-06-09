

from app.core.config import settings
from google import genai
from google.genai import types

client = genai.Client(api_key=settings.GEMINI_API_KEY)
def embed_text(texts:list[str])->list[list[float]]:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=texts,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    return [e.values for e in result.embeddings]


