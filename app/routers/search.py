import re
from bson import ObjectId
from fastapi import APIRouter, Query, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_database
from app.core.cache import cache
from app.core.logging import logger
from app.models.schemas import PaginatedSearchResponse, SearchResult, AnalyticsSummary
from app.services.analytics import get_analytics_summary

router = APIRouter(tags=["Search & Summary"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/search", response_model=PaginatedSearchResponse)
@limiter.limit("30/minute")
async def search(
    request: Request,
    q: str = Query(..., min_length=1, description="Search keyword"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    sentiment: str | None = Query(default=None, description="Filter by sentiment"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Full-text search over processed articles.
    Supports pagination and optional sentiment filter.
    """
    # Build filter
    filters: dict = {
        "$or": [
            {"title": {"$regex": re.escape(q), "$options": "i"}},
            {"keywords": {"$elemMatch": {"$regex": re.escape(q), "$options": "i"}}},
        ]
    }
    if sentiment and sentiment in ("positive", "negative", "neutral"):
        filters["sentiment"] = sentiment

    col = db["processed_data"]
    total = await col.count_documents(filters)
    skip = (page - 1) * page_size

    cursor = (
        col.find(filters)
        .sort("trend_score", -1)
        .skip(skip)
        .limit(page_size)
    )
    docs = await cursor.to_list(length=page_size)

    results = [
        SearchResult(
            id=str(doc["_id"]),
            title=doc["title"],
            sentiment=doc["sentiment"],
            keywords=doc.get("keywords", []),
            score=doc.get("score", 0.0),
            trend_score=doc.get("trend_score", 0),
            published_at=doc["published_at"],
        )
        for doc in docs
    ]

    return PaginatedSearchResponse(
        query=q,
        page=page,
        page_size=page_size,
        total=total,
        results=results,
    )


@router.get("/analytics/summary", response_model=AnalyticsSummary)
@limiter.limit("20/minute")
async def analytics_summary(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """High-level system summary. Cached for 5 minutes."""
    cache_key = "analytics:summary"
    cached = cache.get(cache_key)
    if cached:
        logger.info("Serving /analytics/summary from cache")
        return AnalyticsSummary(**cached)

    data = await get_analytics_summary(db["raw_data"], db["processed_data"])
    cache.set(cache_key, data, ttl_seconds=300)
    return AnalyticsSummary(**data)
