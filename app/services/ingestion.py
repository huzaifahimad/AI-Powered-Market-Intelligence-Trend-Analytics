import httpx
from datetime import datetime, timezone
from typing import Any
from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

NEWS_API_BASE = "https://newsapi.org/v2"

# Supported top-level headlines categories
HEADLINES_CATEGORIES = {
    "business", "entertainment", "general", "health",
    "science", "sports", "technology",
}


class NewsAPIError(Exception):
    pass


async def fetch_news(query: str, category: str, page_size: int) -> list[dict[str, Any]]:
    """
    Fetch articles from News API and return normalized raw documents.

    Uses /everything for keyword queries; falls back to /top-headlines
    when the category matches a supported News API category.
    """
    if not settings.news_api_key:
        raise NewsAPIError("NEWS_API_KEY is not configured.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Try /everything first for rich, non-paginated results
        params = {
            "apiKey": settings.news_api_key,
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": min(page_size, 100),
        }
        response = await client.get(f"{NEWS_API_BASE}/everything", params=params)

        # Fallback: if /everything fails or no results, try /top-headlines
        if response.status_code == 200:
            data = response.json()
            articles = data.get("articles", [])
        else:
            articles = []

        if not articles and category.lower() in HEADLINES_CATEGORIES:
            hl_params = {
                "apiKey": settings.news_api_key,
                "category": category.lower(),
                "language": "en",
                "pageSize": min(page_size, 100),
            }
            hl_response = await client.get(
                f"{NEWS_API_BASE}/top-headlines", params=hl_params
            )
            if hl_response.status_code != 200:
                raise NewsAPIError(
                    f"News API returned {hl_response.status_code}: {hl_response.text}"
                )
            hl_data = hl_response.json()
            if hl_data.get("status") != "ok":
                raise NewsAPIError(
                    f"News API error: {hl_data.get('message', 'Unknown error')}"
                )
            articles = hl_data.get("articles", [])

    if response.status_code != 200 and not articles:
        raise NewsAPIError(f"News API returned {response.status_code}: {response.text}")

    logger.info(f"Fetched {len(articles)} articles for query='{query}'")

    normalized = []
    for a in articles:
        # Skip articles with missing critical fields or removed content
        if not a.get("title") or not a.get("url"):
            continue
        if a.get("title", "").strip() == "[Removed]":
            continue

        try:
            published = datetime.fromisoformat(
                a["publishedAt"].replace("Z", "+00:00")
            )
        except (KeyError, ValueError):
            published = datetime.now(timezone.utc)

        normalized.append({
            "title": a.get("title", "").strip(),
            "source": a.get("source", {}).get("name", "Unknown"),
            "published_at": published,
            "content": (a.get("content") or "")[:2000],  # Cap content length
            "description": (a.get("description") or "")[:500],
            "url": a["url"],
            "category": category,
            "query": query,
            "ingested_at": datetime.now(timezone.utc),
        })

    return normalized
