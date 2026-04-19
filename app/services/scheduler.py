"""Scheduled automation: periodic ingestion (Bonus Feature)."""

import asyncio
from datetime import datetime, timezone
from app.core.config import get_settings
from app.core.logging import logger
from app.core.database import get_database
from app.services.ingestion import fetch_news, NewsAPIError
from app.services.processor import process_article

settings = get_settings()

# Default queries to rotate through
DEFAULT_QUERIES = [
    ("artificial intelligence", "technology"),
    ("stock market economy", "business"),
    ("climate change energy", "science"),
    ("cybersecurity data breach", "technology"),
    ("startup funding venture", "business"),
]

_scheduler_task: asyncio.Task | None = None


async def _scheduled_ingestion_loop(interval_minutes: int = 60):
    """
    Background loop that fetches fresh data periodically.
    Rotates through default queries each cycle.
    """
    cycle = 0
    logger.info(f"Scheduler started: ingesting every {interval_minutes} minutes")

    while True:
        try:
            query, category = DEFAULT_QUERIES[cycle % len(DEFAULT_QUERIES)]
            logger.info(f"[Scheduler] Cycle {cycle + 1}: query='{query}' category='{category}'")

            articles = await fetch_news(query, category, page_size=20)
            db = get_database()
            raw_col = db["raw_data"]
            processed_col = db["processed_data"]

            stored = 0
            for article in articles:
                result = await raw_col.update_one(
                    {"url": article["url"]},
                    {"$setOnInsert": article},
                    upsert=True,
                )
                if result.upserted_id:
                    stored += 1
                    raw_id = str(result.upserted_id)
                    processed = process_article(article, raw_id)
                    await processed_col.update_one(
                        {"raw_id": raw_id},
                        {"$setOnInsert": processed},
                        upsert=True,
                    )

            logger.info(
                f"[Scheduler] Cycle {cycle + 1} done: "
                f"{stored}/{len(articles)} new articles stored"
            )

        except NewsAPIError as e:
            logger.error(f"[Scheduler] NewsAPI error: {e}")
        except Exception as e:
            logger.exception(f"[Scheduler] Unexpected error: {e}")

        cycle += 1
        await asyncio.sleep(interval_minutes * 60)


def start_scheduler(interval_minutes: int = 60) -> asyncio.Task:
    """Start the background scheduler. Returns the asyncio Task."""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        logger.warning("Scheduler already running")
        return _scheduler_task
    _scheduler_task = asyncio.create_task(
        _scheduled_ingestion_loop(interval_minutes)
    )
    return _scheduler_task


def stop_scheduler():
    """Cancel the scheduler task."""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        logger.info("Scheduler stopped")
        _scheduler_task = None
