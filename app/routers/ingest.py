import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_database
from app.core.cache import cache
from app.core.logging import logger
from app.models.schemas import IngestRequest, IngestResponse
from app.services.ingestion import fetch_news, NewsAPIError
from app.services.processor import process_article
from app.services.validator import validator, ValidationError

router = APIRouter(prefix="/ingest", tags=["Ingestion"])
limiter = Limiter(key_func=get_remote_address)


async def _run_ingestion(
    query: str,
    category: str,
    page_size: int,
    db: AsyncIOMotorDatabase,
    task_id: str,
) -> None:
    """Background task: fetch → validate → store raw → process → store processed."""
    logger.info(f"[Task {task_id}] Starting ingestion: query='{query}' size={page_size}")
    try:
        articles = await fetch_news(query, category, page_size)

        raw_col = db["raw_data"]
        processed_col = db["processed_data"]

        stored = 0
        skipped = 0

        for article in articles:
            # Data validation pipeline
            try:
                validated = validator.validate_raw_article(article)
            except ValidationError as e:
                logger.warning(f"[Task {task_id}] Skipping invalid article: {e}")
                skipped += 1
                continue

            # Upsert by URL to avoid duplicates
            result = await raw_col.update_one(
                {"url": validated["url"]},
                {"$setOnInsert": validated},
                upsert=True,
            )

            if result.upserted_id:
                stored += 1
                raw_id = str(result.upserted_id)
                processed = process_article(validated, raw_id)
                await processed_col.update_one(
                    {"raw_id": raw_id},
                    {"$setOnInsert": processed},
                    upsert=True,
                )

        # Invalidate analytics cache when new data arrives
        if stored > 0:
            cache.invalidate()

        logger.info(
            f"[Task {task_id}] Done. {stored}/{len(articles)} new articles stored, "
            f"{skipped} skipped (validation)"
        )

    except NewsAPIError as e:
        logger.error(f"[Task {task_id}] NewsAPI error: {e}")
    except Exception as e:
        logger.exception(f"[Task {task_id}] Unexpected error: {e}")


@router.post("", response_model=IngestResponse)
@limiter.limit("10/minute")
async def ingest(
    request: Request,
    payload: IngestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Trigger data ingestion from News API.
    Ingestion runs as a background task — returns immediately.
    Data is validated before storage.
    Rate limited to 10 requests/minute.
    """
    task_id = str(uuid.uuid4())[:8]

    # Quick prefetch to give article count in response
    try:
        articles = await fetch_news(payload.query, payload.category, payload.page_size)
    except NewsAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))

    background_tasks.add_task(
        _run_ingestion,
        payload.query,
        payload.category,
        payload.page_size,
        db,
        task_id,
    )

    return IngestResponse(
        message="Ingestion started in background",
        articles_fetched=len(articles),
        articles_stored=0,  # Will be updated in background
        task_id=task_id,
    )
