# DocChat

DocChat is a FastAPI-based document workspace and RAG application for authenticated users to create workspaces, upload files, organize documents, and query them using LLM-backed retrieval.

The project combines:

- FastAPI backend for auth, workspaces, and document APIs
- PostgreSQL for relational metadata and workspace state
- Redis for caching and rate limiting
- Celery for async ingestion jobs
- React + Vite frontend for the UI
- Google OAuth and JWT-based session handling

## Overview

This application is designed for document-driven chat workflows. A user can:

1. Sign up or sign in
2. Create a workspace
3. Invite collaborators and assign roles
4. Upload PDFs or other supported documents
5. Trigger background ingestion
6. Ask questions against the uploaded documents
7. Receive answers grounded in retrieved document chunks

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy + async PostgreSQL
- Redis
- Celery
- Pydantic Settings
- React + Vite + Tailwind CSS
- Google OAuth
- Groq / Gemini LLM integration

## Project Structure

```text
docchat/
├── .env.example
├── .env
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── logger.py
│   ├── main.py
│   ├── celery_app.py
│   ├── oauth/
│   │   └── app/
│   │       ├── core/
│   │       ├── router/
│   │       ├── schemas/
│   │       ├── services/
│   │       └── utils/
│   ├── rag/
│   │   ├── rag_app/
│   │   │   ├── models/
│   │   │   ├── routers/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── tasks/
│   │   ├── tests/
│   │   └── temp/
│   ├── ratelimiter/
│   │   └── app/
│   ├── user_service/
│   ├── workspace_service/
│   └── test.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── postcss.config.cjs
│   ├── tailwind.config.cjs
│   └── src/
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── README.md
├── package-lock.json
└── .gitignore
```

## Key Features

- User authentication and refresh token flow
- Workspace creation and access control
- Invite and role-based membership management
- File upload and asynchronous document ingestion
- Retrieval-augmented generation over uploaded documents
- Redis-backed caching and rate-limited auth endpoints
- FastAPI docs available at `/docs`
- React frontend for workspace and chat experiences

## Prerequisites

Before starting the project, make sure you have:

- Python 3.11+
- Node.js 18+
- npm
- Docker and Docker Compose
- Redis and PostgreSQL available via Docker or local services

## Environment Setup

Create a local `.env` file from the example template:

```bash
cp .env.example .env
```

The environment variables used by the app include:

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

- `DATABASE_URL` should point to your PostgreSQL database
- `REDIS_URL` is used for caching and rate limiting
- `SECRET_KEY` and `ALGORITHM` are required for JWT auth
- `GOOGLE_*` values are used for Google OAuth login

## Local Development

### 1) Create and activate a virtual environment

```bash
cd docchat
python -m venv .venv
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

### 2) Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3) Start supporting services with Docker

```bash
docker compose up -d
```

This project includes PostgreSQL and Redis in `docker-compose.yml`:

- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

### 4) Run the backend

From the project root:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints are available at:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 5) Run the Celery worker

Open a second terminal and run:

```bash
celery -A app.rag.celery_app worker --loglevel=info
```

This worker handles asynchronous document ingestion and indexing work.

### 6) Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is typically exposed at:

- `http://localhost:5173`

## Authentication APIs

Authentication routes are defined under the `/auth` prefix.

### Common auth endpoints

```http
GET /auth/oauth
GET /auth/google/callback
POST /auth/refresh
POST /auth/logout
POST /auth/login
POST /auth/create-user
PATCH /auth/reset-password
POST /auth/forgot-password
PATCH /auth/set-password
POST /auth/add-password
GET /auth/get-session
```

These endpoints cover Google login, local user registration, JWT refresh, password reset, and session retrieval.

## Workspace APIs

Workspace routes are mounted under `/rag`.

```http
POST /rag/workspaces
GET /rag/myWorkspace
DELETE /rag/workspace/{wk_id}
POST /rag/workspace/{wk_id}/invite
PATCH /rag/workspace/{wk_id}/{user_id}/role/{role}
```

These endpoints manage workspace creation, membership, role updates, and invitations.

## Document and RAG APIs

```http
POST /rag/workspaces/{wk_id}/documents/upload
GET /rag/task/{task_id}
GET /rag/documents
POST /rag/query/{wk_id}
```

### Upload flow

- Client uploads a file to a workspace
- The backend saves the file to the temp directory
- Celery enqueues a processing job
- The job ingests the document and prepares it for retrieval

### Query flow

- User sends a question with a workspace id
- Relevant document chunks are retrieved
- The LLM generates a response using the retrieved context
- The answer is streamed back to the user

## Rate Limiting

The project includes a rate limiting module under `app/ratelimiter` for protecting endpoints, especially auth-related flows. It uses Redis-backed strategies such as:

- Token bucket
- Fixed window
- Sliding window

This helps prevent abuse and brute-force access patterns.

## Database and Migrations

The project uses Alembic for schema migrations.

Typical commands:

```bash
alembic revision --autogenerate -m "describe migration"
alembic upgrade head
```

## Typical Workflow

1. Create a user account or sign in
2. Create a workspace
3. Invite users or manage roles
4. Upload a PDF or document
5. Wait for ingestion to finish
6. Ask a question in the workspace
7. Receive a grounded answer using the document context

## Troubleshooting

### Backend fails to start

Check that:

- `.env` exists and contains the required values
- PostgreSQL is running
- Redis is running
- dependencies were installed with `pip install -r requirements.txt`

### Celery task not processing

Make sure the worker is running in a separate terminal:

```bash
celery -A app.rag.celery_app worker --loglevel=info
```

### Frontend does not load

Verify that:

- Node dependencies are installed with `npm install`
- Vite is running in the frontend directory
- the backend is reachable on port 8000

## Notes

- The application expects a valid `.env` configuration before startups.
- File uploads are written to a temporary working directory and processed asynchronously.
- The project is built for local development and can be extended for production deployment with stronger secrets, deployment configuration, and infra hardening.

## License

This project does not currently declare a license in the repository. If needed, add one before public distribution.


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