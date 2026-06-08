import requests

response = requests.post(
    'http://localhost:8000/rag/query',
    headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2IiwiZXhwIjoxNzc5NTc0NDAxfQ.7M_XUm9vxN5Oznj38LQhUGPbYPL1mWMhzg4TCd7ABrA"},
    json={"question": "what is coastal popution?","document_id":6},
    stream=True,
    timeout=60
)

for chunk in response.iter_content(chunk_size=None):
    if chunk:
       print(chunk.decode(), end="", flush=True)