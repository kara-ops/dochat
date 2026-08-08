# Rate Limiter

A robust rate limiting service built with FastAPI and Redis that supports multiple rate limiting algorithms. This application provides flexible rate limiting capabilities for API endpoints with per-IP tracking and atomic operations using Lua scripts.

## Features

- **Multiple Rate Limiting Algorithms**
  - **Token Bucket**: Allows burst traffic while maintaining average rate limits
  - **Fixed Window**: Simple rate limiting over fixed time windows
  - **Sliding Window**: More accurate rate limiting based on a rolling time window

- **Redis-Backed**: Distributed rate limiting across multiple instances using Redis
- **Atomic Operations**: Lua scripts ensure thread-safe rate limit checks
- **Proxy Support**: Automatically detects and uses `x-forwarded-for` headers for accurate IP tracking
- **FastAPI Integration**: Easy-to-use dependency injection for protecting endpoints
- **Async/Await**: Full async support for high-performance request handling

## Architecture

```
app/
├── core/           # Configuration and core settings
├── database/       # Redis client initialization
├── dependency/     # FastAPI dependencies for rate limiting
├── services/       # Rate limiting algorithm implementations
└── scripts/        # Lua scripts for atomic Redis operations
```

### Rate Limiting Algorithms

#### Token Bucket
- Generates tokens at a configurable refill rate
- Allows requests up to bucket capacity
- Best for: Allowing burst traffic while maintaining average throughput
- Parameters: `capacity` (max tokens), `refill_rate` (tokens/second)

#### Fixed Window
- Counts requests in fixed-duration time windows
- Resets counter after TTL expires
- Best for: Simple rate limiting with predictable limits
- Parameters: `limit` (max requests), `ttl` (window duration in seconds)

#### Sliding Window
- Removes old requests outside the window and counts remaining
- More accurate than fixed window
- Best for: Precise rate limiting without gaps
- Parameters: `window` (duration in seconds), `limit` (max requests)

## Prerequisites

- Python 3.8+
- Redis 6.0+
- Docker & Docker Compose (optional)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ratelimiter
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your Redis connection details:
```
REDIS_URL=redis://localhost:6379/0
```

## Quick Start

### Using Docker Compose (Recommended)

Start Redis with one command:
```bash
docker-compose up -d
```

### Manual Setup

If you have Redis running locally, ensure it's accessible at the configured URL.

### Running the Application

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Usage Examples

### Token Bucket Rate Limiter

Protect an endpoint with token bucket rate limiting:

```python
from fastapi import FastAPI, Depends
from app.dependency.tb_dependency import tb_ratelimiter

app = FastAPI()

@app.get("/api/data")
async def get_data(
    _=Depends(tb_ratelimiter(capacity=10, refill_rate=2))
):
    return {"data": "example"}
```

This allows:
- Up to 10 tokens initially
- 2 new tokens generated per second
- Perfect for APIs that need to handle bursts

### Fixed Window Rate Limiter

```python
from fastapi import FastAPI, Depends
from app.dependency.fw_dependency import fixed_window_limiter

app = FastAPI()

@app.get("/api/search")
async def search(
    query: str,
    _=Depends(lambda req: fixed_window_limiter(limit=100, ttl=60, req=req))
):
    return {"results": []}
```

This allows:
- 100 requests per 60 seconds per IP
- Counter resets after 60 seconds

### Sliding Window Rate Limiter

```python
from fastapi import FastAPI, Depends
from app.services.s_w import SlidingWindowLimiter

app = FastAPI()

@app.get("/api/premium")
async def premium_endpoint(
    _=Depends(lambda req: sliding_window_limiter(window=60, limit=50, req=req))
):
    return {"premium": "data"}
```

## How It Works

### IP Detection

The rate limiter identifies clients by IP address:
1. First, checks for `x-forwarded-for` header (for proxied requests)
2. Falls back to direct client IP if no proxy header exists

This ensures accurate rate limiting even behind load balancers and reverse proxies.

### Redis Key Structure

- Token Bucket: `ratelimiter:token_bucket:{ip}`
- Fixed Window: `ratelimit:reads:{ip}`
- Sliding Window: `ratelimit:sliding:{ip}`

### Atomic Operations

All rate limit checks use Lua scripts to ensure atomicity:
- No race conditions between check and update
- Accurate request counting in distributed environments
- Redis handles the entire operation as a single transaction

## Configuration

### Environment Variables

```env
REDIS_URL=redis://localhost:6379/0  # Redis connection URL
```

### Settings

Configuration is managed in [app/core/config.py](app/core/config.py) using Pydantic `BaseSettings`.

## API Response Codes

- **200 OK**: Request allowed, rate limit not exceeded
- **429 Too Many Requests**: Rate limit exceeded, retry later
- **500 Internal Server Error**: Redis connection or server error

### Rate Limit Exceeded Response

```json
{
  "detail": "Too many requests, try again later"
}
```

## Performance Considerations

- **Redis Optimization**: Uses connection pooling for efficient resource usage
- **Lua Scripts**: Atomic operations minimize race conditions
- **Async I/O**: Non-blocking requests for high throughput
- **Distributed**: Works across multiple application instances

## Testing

Run tests:
```bash
pytest
```

Test a rate limited endpoint:
```bash
# First request succeeds
curl http://localhost:8000/api/data

# Multiple rapid requests will be limited
for i in {1..20}; do curl http://localhost:8000/api/data; done
```

## Troubleshooting

### Redis Connection Error
```
Error: ConnectionRefusedError
```
**Solution**: Ensure Redis is running and accessible at the configured `REDIS_URL`

### 429 Too Many Requests Immediately
- Verify the rate limit parameters (capacity, refill_rate, limit)
- Check if the IP is being correctly identified
- Review Redis logs for issues

### Requests Not Being Limited
- Check Redis connection is working: `redis-cli ping`
- Verify Lua scripts are being loaded correctly
- Confirm the rate limit key is present in Redis: `redis-cli KEYS "ratelimit*"`

## Production Deployment

### Recommendations

1. **Use Redis Cluster** for high-availability and horizontal scaling
2. **Configure Redis Persistence** (RDB or AOF) to prevent data loss
3. **Set up Redis Authentication** in production environments
4. **Use a load balancer** to distribute traffic across multiple instances
5. **Monitor Redis Memory** usage and set appropriate eviction policies

### Docker Production Setup

```bash
docker-compose -f docker-compose.yml up -d
```

## Project Structure

```
ratelimiter/
├── app/
│   ├── core/
│   │   └── config.py           # Configuration and settings
│   ├── database/
│   │   └── redis_client.py     # Redis client initialization
│   ├── dependency/
│   │   ├── tb_dependency.py    # Token bucket FastAPI dependency
│   │   └── fw_dependency.py    # Fixed window FastAPI dependency
│   ├── services/
│   │   ├── token_bucket.py     # Token bucket algorithm
│   │   ├── fixed_window.py     # Fixed window algorithm
│   │   └── s_w.py              # Sliding window algorithm
│   └── scripts/
│       ├── token_bucket.lua    # Token bucket Lua script
│       └── sliding_window.lua  # Sliding window Lua script
├── docker-compose.yml          # Docker Compose configuration
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variable template
└── README.md                  # This file
```

## Dependencies

Key dependencies:
- **fastapi**: Modern web framework
- **redis**: Redis client for async operations
- **pydantic-settings**: Configuration management
- **uvicorn**: ASGI web server

See [requirements.txt](requirements.txt) for complete list.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license here]

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Last Updated**: August 2, 2026
