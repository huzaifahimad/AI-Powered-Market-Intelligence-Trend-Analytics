from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.database import connect_db, close_db
from app.core.logging import logger
from app.core.cache import cache
from app.routers import ingest, analytics, search
from app.services.scheduler import start_scheduler, stop_scheduler

# ── Rate limiter (Advanced Feature) ──────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Market Intelligence API...")
    await connect_db()

    # Start scheduled automation (Bonus Feature)
    # Runs every 60 minutes — set to 0 or comment out to disable
    start_scheduler(interval_minutes=60)
    logger.info("Scheduled automation started (60 min interval)")

    yield

    stop_scheduler()
    cache.invalidate()
    await close_db()
    logger.info("Market Intelligence API shutdown complete.")


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-Powered Market Intelligence & Trend Analytics",
    description=(
        "Production-grade backend for ingesting, processing, and analyzing "
        "market news data. Built with FastAPI + MongoDB Atlas.\n\n"
        "**Advanced Features:** Background Tasks, Rate Limiting, Logging, "
        "In-Memory Caching, Data Validation Pipeline\n\n"
        "**Bonus:** Scheduled Automation (periodic ingestion)"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiter middleware ───────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check logs for details."},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(ingest.router)
app.include_router(analytics.router)
app.include_router(search.router)


# ── System endpoints ─────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "cache_size": cache.size,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Market Intelligence API is running.",
        "docs": "/docs",
        "health": "/health",
    }
