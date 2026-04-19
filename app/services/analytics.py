from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter
from typing import Any
from motor.motor_asyncio import AsyncIOMotorCollection


async def get_trending_keywords(
    processed_col: AsyncIOMotorCollection,
    days: int = 7,
) -> dict[str, Any]:
    """Aggregate top keywords from the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"published_at": {"$gte": cutoff}}},
        {"$unwind": "$keywords"},
        {
            "$group": {
                "_id": "$keywords",
                "count": {"$sum": 1},
                "avg_trend": {"$avg": "$trend_score"},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]

    cursor = processed_col.aggregate(pipeline)
    results = await cursor.to_list(length=None)

    total_docs = await processed_col.count_documents(
        {"published_at": {"$gte": cutoff}}
    )

    keywords = [
        {
            "keyword": r["_id"],
            "count": r["count"],
            "trend_score": round(r["avg_trend"], 2),
        }
        for r in results
    ]

    return {
        "days": days,
        "total_articles": total_docs,
        "top_keywords": keywords,
    }


async def get_insights(
    processed_col: AsyncIOMotorCollection,
    days: int = 30,
) -> dict[str, Any]:
    """Aggregated insights: sentiment breakdown, keywords, daily trend."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Sentiment pipeline
    sentiment_pipeline = [
        {"$match": {"published_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    sentiment_cursor = processed_col.aggregate(sentiment_pipeline)
    sentiment_results = await sentiment_cursor.to_list(length=None)

    sentiment_map = {r["_id"]: r["count"] for r in sentiment_results}
    pos = sentiment_map.get("positive", 0)
    neg = sentiment_map.get("negative", 0)
    neu = sentiment_map.get("neutral", 0)
    total_s = max(pos + neg + neu, 1)

    # Keywords pipeline
    kw_pipeline = [
        {"$match": {"published_at": {"$gte": cutoff}}},
        {"$unwind": "$keywords"},
        {"$group": {"_id": "$keywords", "count": {"$sum": 1}, "avg_trend": {"$avg": "$trend_score"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    kw_cursor = processed_col.aggregate(kw_pipeline)
    kw_results = await kw_cursor.to_list(length=None)

    # Daily trend pipeline
    daily_pipeline = [
        {"$match": {"published_at": {"$gte": cutoff}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$published_at",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    daily_cursor = processed_col.aggregate(daily_pipeline)
    daily_results = await daily_cursor.to_list(length=None)

    # Compute growth rates
    daily_trend = []
    for i, day in enumerate(daily_results):
        growth = None
        if i > 0 and daily_results[i - 1]["count"] > 0:
            prev = daily_results[i - 1]["count"]
            growth = round((day["count"] - prev) / prev * 100, 2)
        daily_trend.append({"date": day["_id"], "count": day["count"], "growth_rate": growth})

    # Avg trend score
    avg_pipeline = [
        {"$match": {"published_at": {"$gte": cutoff}}},
        {"$group": {"_id": None, "avg": {"$avg": "$trend_score"}}},
    ]
    avg_cursor = processed_col.aggregate(avg_pipeline)
    avg_result = await avg_cursor.to_list(length=1)
    avg_trend = round(avg_result[0]["avg"], 2) if avg_result else 0.0

    return {
        "total_articles": total_s,
        "sentiment_breakdown": {
            "positive": pos,
            "negative": neg,
            "neutral": neu,
            "positive_pct": round(pos / total_s * 100, 1),
            "negative_pct": round(neg / total_s * 100, 1),
            "neutral_pct": round(neu / total_s * 100, 1),
        },
        "top_keywords": [
            {"keyword": r["_id"], "count": r["count"], "trend_score": round(r["avg_trend"], 2)}
            for r in kw_results
        ],
        "daily_trend": daily_trend,
        "avg_trend_score": avg_trend,
    }


async def get_analytics_summary(
    raw_col: AsyncIOMotorCollection,
    processed_col: AsyncIOMotorCollection,
) -> dict[str, Any]:
    """High-level summary statistics across all data."""
    total_raw = await raw_col.count_documents({})
    total_processed = await processed_col.count_documents({})

    # Sentiment breakdown (all time)
    sentiment_pipeline = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    s_cursor = processed_col.aggregate(sentiment_pipeline)
    s_results = await s_cursor.to_list(length=None)
    s_map = {r["_id"]: r["count"] for r in s_results}

    pos = s_map.get("positive", 0)
    neg = s_map.get("negative", 0)
    neu = s_map.get("neutral", 0)
    total_s = max(pos + neg + neu, 1)

    # Most active day
    most_active_pipeline = [
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$published_at"}},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    ma_cursor = processed_col.aggregate(most_active_pipeline)
    ma_result = await ma_cursor.to_list(length=1)
    most_active = ma_result[0]["_id"] if ma_result else None

    # Avg sentiment score
    avg_s_pipeline = [
        {"$group": {"_id": None, "avg": {"$avg": "$sentiment_score"}}},
    ]
    avg_s_cursor = processed_col.aggregate(avg_s_pipeline)
    avg_s_result = await avg_s_cursor.to_list(length=1)
    avg_sentiment = round(avg_s_result[0]["avg"], 4) if avg_s_result else 0.0

    # Top 5 keywords
    kw_pipeline = [
        {"$unwind": "$keywords"},
        {"$group": {"_id": "$keywords", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    kw_cursor = processed_col.aggregate(kw_pipeline)
    kw_results = await kw_cursor.to_list(length=None)
    top_keywords = [r["_id"] for r in kw_results]

    # Last ingestion timestamp
    last_raw = await raw_col.find_one(sort=[("ingested_at", -1)])
    last_ingestion = last_raw.get("ingested_at") if last_raw else None

    return {
        "total_raw_articles": total_raw,
        "total_processed_articles": total_processed,
        "sentiment_breakdown": {
            "positive": pos,
            "negative": neg,
            "neutral": neu,
            "positive_pct": round(pos / total_s * 100, 1),
            "negative_pct": round(neg / total_s * 100, 1),
            "neutral_pct": round(neu / total_s * 100, 1),
        },
        "most_active_day": most_active,
        "avg_sentiment_score": avg_sentiment,
        "top_5_keywords": top_keywords,
        "last_ingestion": last_ingestion,
    }
