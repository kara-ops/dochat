from groq import AsyncGroq
from google.genai import types
from app.core.config import settings


client = AsyncGroq(api_key=settings.GROQ_API_KEY)
async def generate_ans(ques:str,chunks:list[str]):
    formated = formatted = "\n\n".join(
    f"[{i+1}] {c['filename']} (chunk {c['chunk_index']}):\n{c['content']}"
    for i, c in enumerate(chunks)
)

    prompt_str = f"""Answer using ONLY the sources below. Cite sources as [1], [2] etc.
                If the answer isn't in the sources, say "Not found in documents."

                Sources:
                {formatted}

                Question: {ques}

                Reply in JSON:
                {{"answer": "<your answer with inline citations>", "sources": ["filename, chunk X", few starting words of chunk]}}"""          
    
    # result="creater of this rag is broke, he cant afford a ai"
    result = await client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[{"role": "user", "content": prompt_str}],
        stream=True,
        temperature=0
    )
    async for chunk in result:
        token = chunk.choices[0].delta.content
        print({"token":repr(token)})
        if token:
            yield token
