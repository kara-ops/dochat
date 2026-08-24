from starlette.concurrency import run_in_threadpool
from app.core.config import settings
from google import genai
from google.genai import types

import  voyageai 


client = voyageai.Client(api_key=settings.VOYGERAI_API_KEY)
async def embed_text(texts:list[str])->list[list[float]]:
    def _embed(texts:list[str]):
        result = client.embed(
                texts,
                model="voyage-4-large",
                input_type="document",
                output_dimension=1024
            )
        return result.embeddings
    # if len(texts)<=100:
    return await run_in_threadpool(_embed,texts)
    # else:
    #     batched_embeddings=[]
    #     for i in range(0,len(texts),100):
    #         batch = await run_in_threadpool(_embed,texts[i:i+100])
    #         if batch:
    #             batched_embeddings.extend(batch)
    #     return batched_embeddings



