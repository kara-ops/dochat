# OAuth 2.0 Auth Service

This repository contains a FastAPI authentication backend that supports both Google OAuth 2.0 and local email/password authentication. It issues JWT access tokens, maintains refresh-token sessions, and tracks device/session metadata in PostgreSQL.

## Stack
- FastAPI
- PostgreSQL + SQLAlchemy + Alembic
- Redis
- Pydantic v2
- python-jose
- httpx
- argon2-cffi (Password Hashing)

## What It Provides
- Google login and callback handling
- Local sign-up and login
- JWT access and refresh tokens
- Refresh-token rotation
- Session tracking per device
- Password reset, forgot-password, and add-password flows
- Email delivery for forgot-password flows (via Resend)
- Protected user profile endpoints

## Project Layout
- [app/main.py](app/main.py) is the application entry point.
- [app/router/auth_routers.py](app/router/auth_routers.py) exposes the auth API.
- [app/router/users.py](app/router/users.py) exposes the user profile endpoint.
- [app/services/auth_service.py](app/services/auth_service.py) contains the auth business logic.
- [app/services/token_service.py](app/services/token_service.py) contains Redis-backed helpers.
- [app/models/user_model.py](app/models/user_model.py) defines the database models.

## Runtime Behavior
On startup, the app checks that PostgreSQL and Redis are reachable before serving requests. The FastAPI app also enables CORS for the Vite frontend running on `http://localhost:5173`.

Google login creates or links a user, stores a refresh-session record in PostgreSQL, and returns a short-lived access token plus an HTTP-only refresh cookie. Local login and sign-up follow the same session flow.

Important detail: refresh tokens are hashed and stored in the `user_session` table. Redis is used for short-lived cache helpers, not as the primary refresh-token store.

## Environment Variables
Create a `.env` file from `.env.example` and provide values for:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SECRET_KEY`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `DATABASE_URL`
- `REDIS_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Local Setup
1. Install dependencies.

```bash
pip install -r requirements.txt
```

2. Copy the example environment file.

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis. The included `docker-compose.yml` maps Postgres to port `5434` and Redis to `6379`.

```bash
docker compose up -d
```

4. Run Alembic migrations.

```bash
alembic upgrade head
```

5. Start the API.

```bash
uvicorn app.main:app --reload
```

If you run the frontend too, it expects the backend to be available locally and uses the Vite dev server on `http://localhost:5173`.

## API Endpoints

### Auth Routes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/oauth` | Redirect the browser to Google OAuth |
| GET | `/auth/google/callback` | Handle the Google callback and create or link the user |
| POST | `/auth/refresh` | Rotate the current refresh token and return a new access token |
| POST | `/auth/logout` | Clear the refresh cookie and validate the bearer token format |
| POST | `/auth/login` | Log in with email and password |
| POST | `/auth/create-user` | Create a local email/password account |
| PATCH | `/auth/reset-password` | Change the current password for a logged-in local user |
| POST | `/auth/forgot-password` | Send a password reset email with a verification code |
| PATCH | `/auth/set-password` | Set a new password using a verification code and url token |
| POST | `/auth/add-password` | Add a password to an existing Google-only account |
| GET | `/auth/get-session` | Return cached or database-backed session details |

### User Routes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/users/me` | Return the current authenticated user |

## Data Model

The main models live in [app/models/user_model.py](app/models/user_model.py).

- `users` stores profile data such as email, name, avatar URL, and activation state.
- `user_auth` stores provider-specific auth data for `local` and `google` accounts.
- `user_session` stores refresh-session state, device metadata, IP address, user agent, timestamps, and the hashed refresh token.

This design allows one user account to be linked to multiple auth providers.

## Auth Flow Summary

### Google Login
1. The client hits `GET /auth/oauth`.
2. The browser is redirected to Google.
3. Google redirects back to `GET /auth/google/callback`.
5. The backend exchanges the code for Google user data.
6. The user is created or linked in PostgreSQL.
7. A session row is created with device and browser metadata.
8. An access token is returned and a refresh token is set in an HTTP-only cookie.

### Local Login
1. The client posts email and password to `POST /auth/login`.
2. The backend verifies the password hash.
3. A new session row is created.
4. An access token is returned and a refresh token is set in an HTTP-only cookie.

### Refresh
1. The client calls `POST /auth/refresh` with the refresh cookie.
2. The backend validates the token against the stored session hash.
3. New access and refresh tokens are generated.
4. The session record is updated and the cookie is replaced.

### Logout
1. The client calls `POST /auth/logout` with a bearer access token.
2. The backend validates the token type.
3. The refresh cookie is deleted.

### Forgot Password
1. The client posts an email to `POST /auth/forgot-password`.
2. The backend generates a verification code and stores it in Redis.
3. The backend uses `resend` to email the code and a reset link to the user.
4. The client submits the code and a new password to `PATCH /auth/set-password?token={url_token}`.
5. The backend verifies the code, updates the password, and clears the Redis key.

## Load Testing

The repository includes a Locust load testing script (`locustfile.py`) with several user scenarios designed to test specific limits and potential race conditions of the system. You can run it with `locust -f locustfile.py`.

### Scenarios & Expected Failures
- **MixedWorkloadUser**: Simulates realistic "Day in the Life" user behavior (fetching profiles, refreshing tokens, logging in/out).
- **LoginFloodUser (CPU Bound)**: Repeatedly logs in to test CPU bottlenecks caused by password hashing. **Expected failures**: You will likely observe CPU constraints and increased latency due to Argon2 hashing overhead.
- **RefreshStormUser (Race Condition Validation)**: Rapidly hits the refresh endpoint to validate the Redis single-flight lock mechanism. **Expected failures**: You will see some `401 Unauthorized` responses. Because tokens are rotated rapidly, client cookies can get out of sync with the backend state. This is an expected race condition behavior of the single-use refresh token rotation design.
- **SignupFloodUser (DB & CPU Bound)**: Continuously registers new accounts to test database write capacity and CPU bounds. **Expected failures**: You may observe database connection pool exhaustion or CPU constraints.

## Notes
- Access tokens are short-lived JWTs and should be sent as `Authorization: Bearer <token>`.
- Refresh tokens are stored in an HTTP-only cookie named `refresh`.
- The repository includes a frontend app under `frontend/`, but the backend can run independently.

## Existing Migrations

The repository already includes Alembic migration history under `Alembic/`, so the current schema can be recreated with `alembic upgrade head` after the services are up.



