# DocChat

DocChat is a FastAPI-based document workspace and RAG (Retrieval-Augmented Generation) application that enables authenticated users to create workspaces, upload documents, and perform high-precision queries powered by hybrid search and LLM reasoning.

The platform leverages **ParadeDB** (PostgreSQL with native BM25 full-text indexing and pgvector) along with **1024-dimensional embeddings** to deliver state-of-the-art hybrid retrieval (Dense Semantic + Sparse Keyword) via Reciprocal Rank Fusion (RRF).

---

## Key Highlights

- **ParadeDB Engine**: Elasticsearch-grade full-text BM25 search native to PostgreSQL without needing an external search cluster.
- **1024-Dimensional Vector Embeddings**: High-capacity embeddings generated via Voyage AI (`voyage-4-large`, 1024-dim) stored and indexed using `pgvector`.
- **Hybrid Retrieval (RRF)**: Combines dense vector cosine similarity (HNSW) and sparse BM25 keyword matching using Reciprocal Rank Fusion ($k=60$) for optimal search accuracy.
- **FastAPI Async Backend**: High-performance asynchronous API for auth, workspaces, document management, and streaming RAG responses.
- **Asynchronous Ingestion**: Celery workers handle PDF processing, chunking, and batch embedding in the background.
- **Enterprise-Ready Auth**: Google OAuth 2.0 and JWT authentication with Redis-backed rate limiting (Token Bucket, Sliding Window, Fixed Window).
- **Modern UI**: Interactive React + Vite frontend with real-time streaming answers and reasoning step extraction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Python 3.11+, FastAPI, SQLAlchemy (asyncio), Pydantic Settings |
| **Database & Search** | **ParadeDB** (`paradedb/paradedb:latest`) — PostgreSQL + BM25 (`pg_search`) + `pgvector` |
| **Embeddings** | **Voyage AI** (`voyage-4-large` with **1024 output dimensions**) |
| **Vector Indexing** | `pgvector` with **1024-dim** Vector column & **HNSW** index (`vector_cosine_ops`) |
| **Text Indexing** | **ParadeDB BM25 Index** (`USING bm25 (id, content)`) |
| **LLMs & Reasoning** | Groq (`qwen/qwen3.6-27b` with thinking extraction) / Google Gemini |
| **Caching & Rate Limiting** | Redis 7 |
| **Task Queue** | Celery (Redis broker/backend) |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Migrations** | Alembic |

---

## Architecture & Search Engine (ParadeDB & pgvector 1024)

DocChat uses **ParadeDB** as its unified database and search engine. ParadeDB extends PostgreSQL to combine relational ACID compliance with Elasticsearch-grade BM25 keyword search and high-dimensional vector search.

```
                  ┌──────────────────────────────────────────────┐
                  │                 User Query                   │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
       Dense Vector Branch                             Sparse Keyword Branch
   (Voyage AI 1024-dim Embedding)                       (ParadeDB BM25 Search)
                 │                                               │
                 ▼                                               ▼
       pgvector Cosine Search                         paradedb.match('content')
   `chunks.embedding <=> :vector`                    `paradedb.score(chunks.id)`
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                        Reciprocal Rank Fusion (RRF)
                 Score = 1/(60 + rank_vec) + 1/(60 + rank_bm25)
                                         │
                                         ▼
                            Top-N Context Chunks
                                         │
                                         ▼
                           LLM Answer Generation
                      (Groq Qwen 3.6 / Gemini Stream)
```

### 1. Vector Dimension: 1024 Dimensions
- Document chunks are embedded into **1024-dimensional vector space** using Voyage AI (`voyage-4-large`, `output_dimension=1024`).
- Stored in the `chunks` table as `embedding Vector(1024)` via `pgvector.sqlalchemy`.
- Fast approximate nearest neighbor search via **HNSW index**:
  ```sql
  CREATE INDEX chunks_hnsw_index ON chunks
  USING hnsw (embedding vector_cosine_ops);
  ```

### 2. BM25 Full-Text Search via ParadeDB
- ParadeDB provides true BM25 scoring directly inside PostgreSQL:
  ```sql
  CREATE INDEX chunks_bm25_index ON chunks
  USING bm25 (id, content)
  WITH (key_field=id, text_fields='{"content":{}}');
  ```
- Queries use native BM25 operators and scoring functions:
  ```sql
  WHERE chunks.id @@@ paradedb.match('content', :question)
  ORDER BY paradedb.score(chunks.id) DESC
  ```

### 3. Hybrid Search via Reciprocal Rank Fusion (RRF)
The retrieval engine combines vector and keyword results in a single SQL query using RRF scoring:
```sql
WITH vector_results AS (
    SELECT chunks.id, chunks.content, chunks.chunk_index, documents.filename,
           ROW_NUMBER() OVER (ORDER BY chunks.embedding <=> CAST(:vector AS vector)) AS rank
    FROM chunks
    JOIN documents ON chunks.document_id = documents.id
    WHERE documents.workspace_id = :wk_id
    LIMIT :k
),
bm25_results AS (
    SELECT chunks.id, chunks.content, chunks.chunk_index, documents.filename,
           ROW_NUMBER() OVER (ORDER BY paradedb.score(chunks.id) DESC) AS rank
    FROM chunks
    JOIN documents ON chunks.document_id = documents.id
    WHERE chunks.id @@@ paradedb.match('content', :question)
      AND documents.workspace_id = :wk_id
    LIMIT :k
),
rrf AS (
    SELECT 
        COALESCE(v.id, b.id)                   AS id,
        COALESCE(v.content, b.content)         AS content,
        COALESCE(v.filename, b.filename)       AS filename,
        COALESCE(v.chunk_index, b.chunk_index) AS chunk_index,
        COALESCE(1.0 / (60 + v.rank), 0) + COALESCE(1.0 / (60 + b.rank), 0) AS rrf_score
    FROM vector_results v 
    FULL OUTER JOIN bm25_results b ON v.id = b.id
)
SELECT id, content, chunk_index, filename, rrf_score
FROM rrf
ORDER BY rrf_score DESC
LIMIT :top_n;
```

---

## Project Structure

```text
docchat/
├── .env.example
├── .env
├── alembic/
│   ├── versions/
│   │   ├── f64bad4196bc_new_tables_formed.py
│   │   ├── 6b275a83a19e_add_hnsw_index_and_bm25_on_chunks_.py
│   │   └── b6059cc19a26_vector_1024.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── core/
│   │   ├── config.py             # App configuration & settings
│   │   ├── database.py           # Async SQLAlchemy engine & session
│   │   └── logger.py
│   ├── main.py                   # FastAPI application entrypoint
│   ├── celery_app.py             # Celery worker configuration
│   ├── oauth/                    # Auth, OAuth2 & user security
│   ├── rag/
│   │   └── rag_app/
│   │       ├── models/service.py # Document & 1024-dim Chunk models
│   │       ├── routers/          # RAG & workspace endpoints
│   │       ├── schemas/          # Pydantic schemas
│   │       ├── services/
│   │       │   ├── embeddings.py # Voyage AI 1024-dim embeddings
│   │       │   ├── retrieval.py  # ParadeDB BM25 + pgvector RRF hybrid search
│   │       │   ├── llm_ans.py    # LLM response generation & stream parser
│   │       │   ├── chunker.py    # Text chunking
│   │       │   ├── ingestion.py  # Document ingestion pipeline
│   │       │   └── cache_service.py
│   │       └── tasks/            # Background Celery tasks
│   ├── ratelimiter/              # Redis rate limiting algorithms
│   ├── user_service/             # User management
│   └── workspace_service/        # Workspaces and role management
├── frontend/                     # React + Vite UI
├── alembic.ini
├── docker-compose.yml            # ParadeDB & Redis containers
├── Dockerfile
└── requirements.txt
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+ & npm**
- **Docker & Docker Compose** (for ParadeDB & Redis)
- **API Keys**:
  - [Voyage AI](https://www.voyageai.com/) (for 1024-dim embeddings)
  - [Groq](https://console.groq.com/) or [Google Gemini](https://aistudio.google.com/) (for LLM generation)
  - Google OAuth Credentials (for Google sign-in)

---

## Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Database (ParadeDB PostgreSQL instance)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5433/dochat

# Redis (Cache, Rate Limiter & Celery Broker)
REDIS_URL=redis://localhost:6379/0

# Embeddings (1024 Dimensions)
VOYGERAI_API_KEY=your_voyage_ai_api_key

# LLM Providers
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# JWT Authentication
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Email / Resend (Optional)
RESEND_API_KEY=onboarding@resend.dev
```

---

## Getting Started

### 1. Start ParadeDB and Redis Services

DocChat's `docker-compose.yml` configures **ParadeDB** (with `pgvector` & `pg_search` pre-installed) and **Redis**:

```bash
docker compose up -d
```

Service mapping:
- **ParadeDB (PostgreSQL 16 + BM25 + pgvector)**: `localhost:5433`
- **Redis 7**: `localhost:6379`

### 2. Set Up Python Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (cmd):
.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Database Migrations

Apply Alembic migrations to configure tables, pgvector extension, and 1024-dim embedding columns:

```bash
alembic upgrade head
```

### 4. Run the FastAPI Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 5. Run the Celery Worker

Open a separate terminal window, activate `.venv`, and start Celery for document processing:

```bash
celery -A app.rag.celery_app worker --loglevel=info
```

### 6. Run the Frontend Application

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## API Reference Overview

### Authentication (`/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/oauth` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | Google OAuth callback handler |
| `POST` | `/auth/create-user` | Register a new user |
| `POST` | `/auth/login` | Login with username/password |
| `POST` | `/auth/refresh` | Refresh access token using refresh token |
| `POST` | `/auth/logout` | Invalidate current session |
| `GET` | `/auth/get-session` | Retrieve active user session |
| `POST` | `/auth/forgot-password` | Request password reset |
| `PATCH` | `/auth/reset-password` | Complete password reset |

### Workspaces & Documents (`/rag`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/rag/workspaces` | Create a new document workspace |
| `GET` | `/rag/myWorkspace` | List user workspaces |
| `DELETE` | `/rag/workspace/{wk_id}` | Delete a workspace |
| `POST` | `/rag/workspace/{wk_id}/invite` | Invite a collaborator to a workspace |
| `PATCH` | `/rag/workspace/{wk_id}/{user_id}/role/{role}` | Update member role |
| `POST` | `/rag/workspaces/{wk_id}/documents/upload` | Upload document (PDF) for async ingestion |
| `GET` | `/rag/task/{task_id}` | Poll document ingestion status |
| `GET` | `/rag/documents` | List documents in workspace |
| `POST` | `/rag/query/{wk_id}` | Query workspace documents (Hybrid RRF + LLM Stream) |

---

## Ingestion & Query Workflow

1. **Document Upload**: User uploads document $\rightarrow$ saved to temporary staging $\rightarrow$ Celery job is dispatched.
2. **Chunking & Embedding**: Celery worker chunks document text $\rightarrow$ generates **1024-dimensional embeddings** with Voyage AI $\rightarrow$ saves chunks with vectors and content to ParadeDB.
3. **Indexing**: ParadeDB automatically indexes chunk content into the **BM25 index** and vector embeddings into the **HNSW index**.
4. **Hybrid Query**:
   - Query text is vectorized into a 1024-dim embedding.
   - Vector similarity search (HNSW cosine distance) and BM25 full-text search are executed simultaneously.
   - Reciprocal Rank Fusion merges both ranks into a single unified relevance score.
5. **Streaming Response**: Top-$N$ chunks are formatted as context $\rightarrow$ streamed through LLM (with thinking process filtered or separated) $\rightarrow$ delivered to user with inline citations.

---

## Troubleshooting

### Database Connection Issues
- Ensure ParadeDB is running: `docker compose ps`
- Confirm you are connecting to port `5433` (as mapped in `docker-compose.yml`), not standard `5432`.
- Verify `DATABASE_URL` matches `postgresql+asyncpg://postgres:password@localhost:5433/dochat`.

### Vector / Migration Errors
- If recreating or upgrading vector columns, ensure the pgvector extension is active in ParadeDB (`CREATE EXTENSION IF NOT EXISTS vector;`).
- Ensure embeddings generated by Voyage AI match the database dimension (`output_dimension=1024`).

### Celery Tasks Stalled
- Check that Redis is running on port `6379`: `docker compose logs redis`.
- Ensure the Celery worker process is active in a dedicated terminal: `celery -A app.rag.celery_app worker --loglevel=info`.

---

## License

This project is licensed under the MIT License.