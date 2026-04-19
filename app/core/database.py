from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    # Verify connection
    await _client.admin.command("ping")
    logger.info("Connected to MongoDB Atlas")
    # Ensure indexes for performance
    await _ensure_indexes()


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
