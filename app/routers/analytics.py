from fastapi import APIRouter, Query, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_database
from app.core.cache import cache
from app.core.logging import logger
from app.models.schemas import TrendsResponse, InsightsResponse
from app.services.analytics import get_trending_keywords, get_insights

router = APIRouter(tags=["Analytics"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/trends", response_model=TrendsResponse)
@limiter.limit("30/minute")
async def trends(
    request: Request,
    days: int = Query(default=7, ge=1, le=90, description="Lookback window in days"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Return top trending keywords over the specified time window. Results cached for 5 minutes."""
    cache_key = f"trends:{days}"
    cached = cache.get(cache_key)
    if cached:
        logger.info(f"Serving /trends?days={days} from cache")
        return TrendsResponse(**cached)

    data = await get_trending_keywords(db["processed_data"], days=days)
    cache.set(cache_key, data, ttl_seconds=300)
    return TrendsResponse(**data)


@router.get("/insights", response_model=InsightsResponse)
@limiter.limit("30/minute")
async def insights(
    request: Request,
    days: int = Query(default=30, ge=1, le=365, description="Lookback window in days"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Aggregated insights: sentiment breakdown, top keywords,
    daily time-series with growth rate. Results cached for 5 minutes.
    """
    cache_key = f"insights:{days}"
    cached = cache.get(cache_key)
    if cached:
        logger.info(f"Serving /insights?days={days} from cache")
        return InsightsResponse(**cached)

    data = await get_insights(db["processed_data"], days=days)
    cache.set(cache_key, data, ttl_seconds=300)
    return InsightsResponse(**data)
