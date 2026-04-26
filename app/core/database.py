import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

_client: AsyncIOMotorClient | None = None


async def connect_db(max_retries: int = 3) -> None:
    """Connect to MongoDB with retry logic for flaky networks (e.g. mobile hotspots)."""
    global _client
    for attempt in range(1, max_retries + 1):
        try:
            _client = AsyncIOMotorClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000,
                tlsCAFile=certifi.where(),
            )
            # Verify connection
            await _client.admin.command("ping")
            logger.info("Connected to MongoDB Atlas")
            # Ensure indexes for performance
            await _ensure_indexes()
            return
        except Exception as e:
            logger.warning(f"MongoDB connection attempt {attempt}/{max_retries} failed: {e}")
            if _client:
                _client.close()
                _client = None
            if attempt < max_retries:
                wait = attempt * 5
                logger.info(f"Retrying in {wait}s...")
                await asyncio.sleep(wait)
            else:
                logger.error("All MongoDB connection attempts failed. App will start without DB.")
                logger.error("Endpoints requiring DB will return 503 until connection is restored.")


async def _ensure_indexes() -> None:
    """Create indexes on startup if they don't already exist."""
    db = get_database()

    raw_col = db["raw_data"]
    await raw_col.create_index([("url", ASCENDING)], unique=True, background=True)
    await raw_col.create_index([("ingested_at", DESCENDING)], background=True)
    await raw_col.create_index([("category", ASCENDING)], background=True)

    proc_col = db["processed_data"]
    await proc_col.create_index([("raw_id", ASCENDING)], unique=True, background=True)
    await proc_col.create_index([("published_at", DESCENDING)], background=True)
    await proc_col.create_index([("sentiment", ASCENDING)], background=True)
    await proc_col.create_index([("trend_score", DESCENDING)], background=True)
    await proc_col.create_index(
        [("title", "text"), ("keywords", "text")],
        name="article_text_index",
        background=True,
    )

    users_col = db["users"]
    await users_col.create_index([("email", ASCENDING)], unique=True, background=True)

    logger.info("MongoDB indexes ensured.")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _client[settings.database_name]


async def get_collections():
    db = get_database()
    return {
        "raw": db["raw_data"],
        "processed": db["processed_data"],
    }
