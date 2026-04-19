# AI-Powered Market Intelligence & Trend Analytics Platform

A production-grade backend system that ingests real-world news data, processes it with NLP, stores it in MongoDB Atlas, and exposes analytics through a FastAPI REST API.

## Architecture

```
News API → /ingest (POST) → raw_data (MongoDB)
                         → Background Task → Processor → processed_data (MongoDB)
                                                       ↓
                         GET /trends        ←──────────┤
                         GET /insights      ←──────────┤
                         GET /search        ←──────────┤
                         GET /analytics/summary ←──────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI 0.111 |
| Database | MongoDB Atlas (Motor async driver) |
| Data Source | News API |
| NLP | Rule-based (no external ML dependency) |
| Deployment | Render / Railway |
| Server | Uvicorn |

## Project Structure

```
market-intel/
├── app/
│   ├── core/
│   │   ├── config.py        # Pydantic settings, env vars
│   │   ├── database.py      # MongoDB connection management
│   │   └── logging.py       # Structured logging setup
│   ├── models/
│   │   └── schemas.py       # All Pydantic request/response models
│   ├── routers/
│   │   ├── ingest.py        # POST /ingest
│   │   ├── analytics.py     # GET /trends, GET /insights
│   │   └── search.py        # GET /search, GET /analytics/summary
│   ├── services/
│   │   ├── ingestion.py     # News API client + normalization
│   │   ├── processor.py     # Sentiment, keywords, trend score
│   │   └── analytics.py     # MongoDB aggregation pipelines
│   └── main.py              # App factory, lifespan, middleware
├── tests/
│   └── test_processor.py
├── .env.example
├── Procfile
├── requirements.txt
└── README.md
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/market-intel.git
cd market-intel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:

```
NEWS_API_KEY=your_key_from_newsapi.org
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/market_intel
DATABASE_NAME=market_intel
```

Get your free News API key at: https://newsapi.org/register  
Get free MongoDB Atlas cluster at: https://cloud.mongodb.com

### 3. Run locally

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Run tests

```bash
pytest tests/ -v
```

---

## API Documentation

### POST /ingest
Fetch and store articles from News API. Runs ingestion as a **background task** and returns immediately.

**Request body:**
```json
{
  "query": "artificial intelligence",
  "category": "technology",
  "page_size": 20
}
```

**Response:**
```json
{
  "message": "Ingestion started in background",
  "articles_fetched": 20,
  "articles_stored": 0,
  "task_id": "a3f8c1d2"
}
```

---

### GET /trends
Returns top trending keywords for the specified time window.

**Query params:**
- `days` (int, default: 7, range: 1–90)

**Sample response:**
```json
{
  "days": 7,
  "total_articles": 143,
  "top_keywords": [
    { "keyword": "intelligence", "count": 48, "trend_score": 72.4 },
    { "keyword": "market", "count": 35, "trend_score": 61.1 }
  ]
}
```

---

### GET /insights
Aggregated insights: sentiment breakdown, top keywords, daily time-series with growth rates.

**Query params:**
- `days` (int, default: 30, range: 1–365)

**Sample response:**
```json
{
  "total_articles": 312,
  "sentiment_breakdown": {
    "positive": 140,
    "negative": 89,
    "neutral": 83,
    "positive_pct": 44.9,
    "negative_pct": 28.5,
    "neutral_pct": 26.6
  },
  "top_keywords": [...],
  "daily_trend": [
    { "date": "2026-04-15", "count": 22, "growth_rate": null },
    { "date": "2026-04-16", "count": 31, "growth_rate": 40.9 }
  ],
  "avg_trend_score": 58.3
}
```

---

### GET /search
Full-text search over processed articles with pagination and optional sentiment filter.

**Query params:**
- `q` (str, required) — search keyword
- `page` (int, default: 1)
- `page_size` (int, default: 10, max: 50)
- `sentiment` (str, optional) — `positive` | `negative` | `neutral`

**Sample response:**
```json
{
  "query": "inflation",
  "page": 1,
  "page_size": 10,
  "total": 47,
  "results": [
    {
      "id": "664abc...",
      "title": "Fed signals rate pause amid cooling inflation",
      "sentiment": "positive",
      "keywords": ["inflation", "rate", "federal", "economy"],
      "score": 0.74,
      "trend_score": 81,
      "published_at": "2026-04-17T14:30:00Z"
    }
  ]
}
```

---

### GET /analytics/summary
High-level system summary: total counts, all-time sentiment, top 5 keywords, last ingestion time.

**Sample response:**
```json
{
  "total_raw_articles": 850,
  "total_processed_articles": 847,
  "sentiment_breakdown": { ... },
  "most_active_day": "2026-04-16",
  "avg_sentiment_score": 0.0821,
  "top_5_keywords": ["market", "growth", "technology", "company", "revenue"],
  "last_ingestion": "2026-04-18T09:15:00Z"
}
```

---

## MongoDB Schema

### `raw_data` collection
```json
{
  "title": "OpenAI announces GPT-5 release",
  "source": "TechCrunch",
  "published_at": "2026-04-17T10:00:00Z",
  "content": "...",
  "description": "...",
  "url": "https://techcrunch.com/...",
  "category": "technology",
  "query": "artificial intelligence",
  "ingested_at": "2026-04-18T09:00:00Z"
}
```

### `processed_data` collection
```json
{
  "raw_id": "664abc123...",
  "title": "OpenAI announces GPT-5 release",
  "sentiment": "positive",
  "sentiment_score": 0.667,
  "keywords": ["openai", "release", "model", "intelligence", "training"],
  "score": 0.82,
  "trend_score": 91,
  "category": "technology",
  "published_at": "2026-04-17T10:00:00Z",
  "processed_at": "2026-04-18T09:00:01Z"
}
```

---

## Advanced Features Implemented

1. **Background Tasks (FastAPI)** — `/ingest` returns immediately; ingestion + processing runs in background via `BackgroundTasks`
2. **Logging System** — Structured logging with timestamps, log levels, and module context via Python `logging`. Configurable via `LOG_LEVEL` env var.

---

## Deployment (Render)

1. Push repo to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in Render dashboard (copy from `.env.example`)
7. Deploy

MongoDB Atlas: whitelist `0.0.0.0/0` in Network Access for Render's dynamic IPs.

---

## Deployment (Railway)

```bash
railway login
railway init
railway add
railway up
```

Set environment variables via Railway dashboard or CLI:
```bash
railway variables set NEWS_API_KEY=... MONGODB_URI=... DATABASE_NAME=market_intel
```

---

## Evaluation Checklist

| Criteria | Status |
|---|---|
| Data Ingestion from real API | ✅ News API with normalization |
| Raw data stored in MongoDB | ✅ `raw_data` collection, upsert by URL |
| Sentiment analysis | ✅ Rule-based, positive/negative/neutral |
| Keyword extraction | ✅ Frequency + stopword filtering |
| Trend score | ✅ Recency decay + content richness |
| Time-series analysis | ✅ Daily counts + growth rate in `/insights` |
| POST /ingest | ✅ |
| GET /trends | ✅ |
| GET /insights | ✅ |
| GET /search | ✅ with pagination + sentiment filter |
| GET /analytics/summary | ✅ |
| Pydantic models | ✅ All request/response models |
| Pagination | ✅ `/search` endpoint |
| Error handling | ✅ Global handler + per-route |
| Background tasks | ✅ Ingestion runs async |
| Logging system | ✅ Structured, configurable |
| Modular code | ✅ Separated routers/services/models/core |
| Deployment ready | ✅ Procfile, env vars, Uvicorn |
