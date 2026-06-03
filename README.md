# — Production-Grade RAG API

A multi-user document Q&A API built with FastAPI and pgvector. Upload any PDF, ask questions, get answers grounded in your document.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   FastAPI   │────▶│   pgvector  │────▶│    Groq     │
│   (Web)     │     │ (Vector DB) │     │    (LLM)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                        
       ▼                                        
┌─────────────┐     ┌─────────────┐            
│    Redis    │     │   Celery    │            
│   (Cache)   │     │  (Worker)   │            
└─────────────┘     └─────────────┘            
```

### Ingestion Pipeline
```
PDF Upload → Text Extraction → Sentence-Aware Chunking (300 tokens, 50 overlap)
→ Batch Embedding (Gemini text-embedding-001, 768 dims)
→ pgvector Storage (HNSW index) → Background Task (Celery)
```

### Query Pipeline
```
Question → Redis Cache Check → Embed Question → Cosine Similarity Search (HNSW)
→ Top-K Chunk Retrieval → LLM Generation (Groq) → Stream Response → Cache Answer
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI |
| Database | PostgreSQL + pgvector |
| Vector Index | HNSW (cosine similarity) |
| Embeddings | Gemini text-embedding-001 (768d) |
| LLM | Groq (Llama 3.1 8B) |
| Cache | Redis (cache-aside) |
| Background Jobs | Celery |
| Auth | JWT (python-jose + bcrypt) |
| Containerization | Docker + Docker Compose |
| Logging | structlog (structured JSON) |

---

## Features

- **Multi-user isolation** — every document scoped to its owner, cross-user access blocked
- **Async ingestion** — upload returns immediately, Celery processes in background
- **Semantic search** — HNSW index on pgvector for fast approximate nearest neighbor search
- **Response caching** — identical questions served from Redis, skipping embedding + LLM
- **Streaming responses** — LLM tokens streamed back in real time
- **Rate limiting** — per-IP limits on upload (10/min) and query (20/min) endpoints
- **Structured logging** — every query logged with latency, user, document, chunk count
- **Global error handling** — clean JSON errors, no stack traces exposed

---

## Project Structure

```
rag-api/
├── app/
│   ├── core/
│   │   ├── config.py        # pydantic settings
│   │   ├── database.py      # SQLAlchemy engine + Redis client
│   │   └── logger.py        # structlog configuration
│   ├── models/
│   │   └── service.py       # User, Document, Chunk models
│   ├── routers/
│   │   ├── auth.py          # register, login
│   │   ├── documents.py     # upload, list documents
│   │   └── query.py         # semantic search + generation
│   ├── schemas/
│   │   └── query_schema.py  # Pydantic request/response models
│   ├── security/
│   │   ├── jwt_handler.py   # JWT encode/decode
│   │   └── dependency.py    # get_current_user dependency
│   └── services/
│       ├── chunker.py       # sentence-aware chunking with overlap
│       ├── embeddings.py    # batch embedding via Gemini
│       ├── storage.py       # save documents + chunks to DB
│       ├── retrieval.py     # pgvector cosine similarity search
│       ├── generation.py    # streaming LLM generation via Groq
│       ├── ingestion.py     # orchestrates full ingestion pipeline
│       └── cache.py         # Redis get/set helpers
├── tasks/
│   └── ingesion_task.py     # Celery async ingestion task
├── alembic/                 # database migrations
├── docker-compose.yml
├── Dockerfile
└── main.py
```

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Gemini API key (aistudio.google.com)
- Groq API key (console.groq.com)

### Setup

```bash
git clone https://github.com/kara-ops/rag-api.git
cd rag-api
```

Create `.env`:
```env
DATABASE_URL=postgresql://postgres:password@db:5432/ragdb
REDIS_URL=redis://redis:6379/0
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

Run:
```bash
docker compose up --build
```

API available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

---

## API Reference

### Auth
```
POST /auth/sign_up     — register new user
POST /auth/sign_in     — login, returns JWT token
```

### Documents
```
POST /rag/upload       — upload PDF (requires auth)
GET  /rag/documents    — list your documents (requires auth)
```

### Query
```
POST /rag/query        — ask a question about a document (requires auth)
GET  /rag/task/{id}    — check ingestion task status
```

### Query Request
```json
{
  "question": "what are the main causes of coastal pollution?",
  "document_id": 1
}
```

### Query Response (streaming)
```
Coastal pollution is primarily caused by...
```

---

## Key Design Decisions

**Why pgvector over Pinecone/Weaviate?**
pgvector runs inside PostgreSQL — no additional infrastructure, no vendor lock-in. With HNSW indexing it handles millions of vectors with sub-10ms search latency. Suitable for production workloads at reasonable scale.

**Why sentence-aware chunking over fixed-size?**
Fixed character splitting cuts sentences mid-thought, degrading retrieval quality. Sentence-aware chunking with 50-token overlap preserves semantic boundaries and ensures context isn't lost at chunk edges.

**Why cache at the query layer?**
Caching the final answer (not embeddings) skips three expensive operations on repeated questions — embedding API call, vector search, and LLM generation. TTL of 1 hour balances freshness with cost.

**Why Celery for ingestion?**
Large PDFs can take 30-60 seconds to process (chunking + batch embedding + DB writes). Synchronous ingestion would block the request thread. Celery processes in background, upload returns immediately with a task ID.

---

## What I Learned

- Vector similarity search and HNSW indexing
- Production RAG architecture — chunking strategy, embedding consistency, retrieval quality
- pgvector as a production vector store inside PostgreSQL
- Cache-aside pattern applied to LLM responses
- Async task processing with Celery + Redis
- JWT authentication with per-resource ownership checks
- Streaming HTTP responses with FastAPI StreamingResponse
- Structured JSON logging for production observability
- Raw SQL queries for performance-critical paths (avoiding ORM overhead on vector search)