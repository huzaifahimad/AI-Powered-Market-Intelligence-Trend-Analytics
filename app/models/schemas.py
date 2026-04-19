from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class SentimentLabel(str, Enum):
    positive = "positive"
    negative = "negative"
    neutral = "neutral"


# ── Request / Response models ──────────────────────────────────────────────────

class IngestRequest(BaseModel):
    query: str = Field(default="technology", description="Search query for News API")
    category: str = Field(default="business", description="News category")
    page_size: int = Field(default=20, ge=1, le=100, description="Number of articles to fetch")


class IngestResponse(BaseModel):
    message: str
    articles_fetched: int
    articles_stored: int
    task_id: str


# ── Raw data model ─────────────────────────────────────────────────────────────

class RawArticle(BaseModel):
    title: str
    source: str
    published_at: datetime
    content: Optional[str] = None
    description: Optional[str] = None
    url: str
    category: str = "general"
    query: str = ""
    ingested_at: datetime = Field(default_factory=datetime.utcnow)


# ── Processed data model ───────────────────────────────────────────────────────

class ProcessedArticle(BaseModel):
    raw_id: str
    title: str
    sentiment: SentimentLabel
    sentiment_score: float = Field(ge=-1.0, le=1.0)
    keywords: list[str]
    score: float = Field(ge=0.0, le=1.0, description="Relevance/confidence score")
    trend_score: int = Field(ge=0, description="Weighted trend metric")
    category: str
    published_at: datetime
    processed_at: datetime = Field(default_factory=datetime.utcnow)


# ── API response models ────────────────────────────────────────────────────────

class TrendKeyword(BaseModel):
    keyword: str
    count: int
    trend_score: float


class TrendsResponse(BaseModel):
    days: int
    total_articles: int
    top_keywords: list[TrendKeyword]


class SentimentBreakdown(BaseModel):
    positive: int
    negative: int
    neutral: int
    positive_pct: float
    negative_pct: float
    neutral_pct: float


class DailyCount(BaseModel):
    date: str
    count: int
    growth_rate: Optional[float] = None


class InsightsResponse(BaseModel):
    total_articles: int
    sentiment_breakdown: SentimentBreakdown
    top_keywords: list[TrendKeyword]
    daily_trend: list[DailyCount]
    avg_trend_score: float


class SearchResult(BaseModel):
    id: str
    title: str
    sentiment: SentimentLabel
    keywords: list[str]
    score: float
    trend_score: int
    published_at: datetime


class PaginatedSearchResponse(BaseModel):
    query: str
    page: int
    page_size: int
    total: int
    results: list[SearchResult]


class AnalyticsSummary(BaseModel):
    total_raw_articles: int
    total_processed_articles: int
    sentiment_breakdown: SentimentBreakdown
    most_active_day: Optional[str]
    avg_sentiment_score: float
    top_5_keywords: list[str]
    last_ingestion: Optional[datetime]
