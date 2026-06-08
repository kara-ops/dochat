# OAuth 2.0 with Google — FastAPI + Redis + JWT

A reusable authentication system built with FastAPI. Supports Google OAuth 2.0 login, JWT access/refresh tokens, token rotation, revocation, and rate limiting.

## Tech Stack
- FastAPI + Uvicorn
- PostgreSQL + SQLAlchemy + Alembic
- Redis (refresh token store + blacklist + rate limiting)
- Pydantic v2
- python-jose (JWT)
- httpx (Google API calls)
- pytest (testing)

## Setup

### 1. Clone and install dependencies
pip install -r requirements.txt

### 2. Environment variables
Copy .env.example to .env and fill in your values:
cp .env.example .env

### 3. Start Postgres and Redis
docker run -d --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=oauth_db -p 5432:5432 postgres
docker run -d --name redis -p 6379:6379 redis

### 4. Run migrations
alembic upgrade head

### 5. Start the server
uvicorn app.main:app --reload

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/google/login | Redirect to Google login |
| GET | /auth/google/callback | Google OAuth callback |
| POST | /auth/google/refresh | Rotate refresh token |
| POST | /auth/google/logout | Revoke tokens |
| GET | /users/me | Get current user (protected) |

## How it works
- Login with Google → receive access token (15 min) + refresh token (7 days)
- Access token is stateless JWT — verified on every protected request
- Refresh token stored in Redis — rotated on every /refresh call
- Logout blacklists the access token JTI in Redis until expiry
- Rate limiting on /login — max 5 attempts per IP per 60 seconds



