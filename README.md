# DocChat

DocChat is a FastAPI-based document workspace and RAG application that lets users authenticate, create workspaces, upload files, and ask questions about uploaded documents. The backend combines PostgreSQL, Redis, Celery, and LLM-powered retrieval to provide document-aware chat over user-owned content.

## Overview

This project is a multi-service application with:

- FastAPI backend for auth, workspace management, file ingestion, and RAG queries
- PostgreSQL for relational data and document metadata
- Redis for caching and broker connectivity
- Celery workers for asynchronous document processing
- React + Vite frontend for the user interface
- OAuth and JWT support for authentication

---

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy + async PostgreSQL
- pgvector-ready PostgreSQL setup
- Redis
- Celery
- Pydantic settings
- React + Vite + Tailwind
- Google / Groq LLM integrations

---

## Project Structure

```text
docchat/
├── .env.example
├── .env
├── alembic/
├── app/
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── logger.py
│   ├── main.py
│   ├── oauth/
│   │   └── app/
│   │       ├── core/
│   │       ├── router/
│   │       ├── schemas/
│   │       ├── services/
│   │       └── utils/
│   ├── rag/
│   │   ├── app/
│   │   │   ├── models/
│   │   │   ├── routers/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── tasks/
│   │   ├── celery_app.py
│   │   └── tests/
│   ├── ratelimiter/
│   ├── user_service/
│   ├── workspace_service/
│   └── test.py
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── README.md
└── package-lock.json
```

---

## Core Features

- User authentication and authorization
- Workspace creation and role-based access control
- Invite and role management inside workspaces
- PDF / document upload workflow
- Background ingestion with Celery
- Document question answering using retrieved context
- Redis-based caching for repeated answers
- FastAPI API endpoints and Swagger docs
- Frontend client for workspace and chat workflows

---

## Environment Variables

Copy [.env.example](.env.example) to a local `.env` and fill in the values.

```env
GEMINI_API_KEY=
GROQ_API_KEY=

DATABASE_URL=
REDIS_URL=

SECRET_KEY=
ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=
REFRESH_TOKEN_EXPIRE_DAYS=

GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
GOOGLE_REDIRECT_URI=

RESEND_API_KEY=onboarding@resend.dev
```

Notes:
- `DATABASE_URL` should point to your Postgres instance
- `REDIS_URL` is used by both the app and Celery
- `SECRET_KEY` and `ALGORITHM` are required for JWT auth
- `GOOGLE_*` values are used for Google OAuth flow if enabled

---

## Local Development

### 1) Install dependencies

```bash
cd Documents/docchat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Start supporting services

```bash
docker compose up -d db redis
```

This starts:
- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`

### 3) Run the backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 4) Run the Celery worker

In a second terminal:

```bash
celery -A app.rag.celery_app worker --loglevel=info
```

This is needed for background document processing tasks.

### 5) Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is served by Vite, typically on:
- http://localhost:5173

---

## Main API Areas

### Authentication

Routes are mounted from the OAuth app and include standard auth flows for users and sessions.

### Workspace Management

```http
POST /rag/workspaces
GET /rag/myWorkspace
DELETE /rag/workspace/{wk_id}
POST /rag/workspace/{wk_id}/invite
PATCH /rag/workspace/{wk_id}/{user_id}/role/{role}
```

### Document Upload and Retrieval

```http
POST /rag/workspaces/{wk_id}/documents/upload
GET /rag/task/{task_id}
GET /rag/documents
```

### RAG Query

```http
POST /rag/query
```

This endpoint accepts a document ID and a question, retrieves relevant context, and streams the answer back to the client.

---

## Sample Workflow

1. Create a user account or sign in.
2. Create a workspace.
3. Invite collaborators or manage workspace roles.
4. Upload a document to a workspace.
5. Wait for the Celery ingestion task to finish.
6. Ask a question against the document via `/rag/query`.
7. Receive a grounded answer based on retrieved chunks.

---

## Notes

- The project is structured as a monorepo-like Python app with a separate frontend directory.
- The backend is modular, with auth, RAG, user, and workspace concerns split into different packages.
- The application is still evolving, so some endpoints and integrations may vary depending on which services are active in your environment.

---

## Useful Commands

```bash
# Start dependencies
docker compose up -d db redis

# Run app
uvicorn app.main:app --reload

# Run worker
celery -A app.rag.celery_app worker --loglevel=info

# Frontend
cd frontend && npm run dev
```

If you want, I can also generate a more polished version with:
- a separate "API reference" section for each endpoint
- a production deployment section
- a troubleshooting section
- a contributor setup guide