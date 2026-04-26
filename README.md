# AI-Powered Market Intelligence & Trend Analytics Platform

A production-grade full-stack application that ingests real-world news data, processes it with NLP (sentiment analysis, keyword extraction, trend scoring), stores it in MongoDB Atlas, and exposes analytics through a FastAPI REST API with a beautiful React dashboard.

## Architecture

```
News API → /ingest (POST) → raw_data (MongoDB)
                         → Background Task → Processor → processed_data (MongoDB)
                                                        ↓
                         GET /trends        ←──────────┤
                         GET /insights      ←──────────┤
                         GET /search        ←──────────┤
                         GET /analytics/summary ←──────┘
                                                        ↓
                         React Frontend ← Dashboard, Search, Ingestion UI
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + Recharts |
| **API Framework** | FastAPI 0.111 |
| **Database** | MongoDB Atlas (Motor async driver) |
| **Authentication** | JWT (python-jose + bcrypt) |
| **Data Source** | News API |
| **NLP** | Rule-based sentiment + keyword extraction |
| **Deployment** | Render (backend) / Vercel (frontend) |
| **Server** | Uvicorn |

## Project Structure

```
market-intel/
├── app/                        # FastAPI Backend
│   ├── core/
│   │   ├── auth.py             # JWT token & password utilities
│   │   ├── cache.py            # In-memory TTL cache
│   │   ├── config.py           # Pydantic settings, env vars
│   │   ├── database.py         # MongoDB connection + indexes
│   │   └── logging.py          # Structured logging setup
│   ├── models/
│   │   └── schemas.py          # All Pydantic request/response models
│   ├── routers/
│   │   ├── auth.py             # POST /auth/signup, POST /auth/login
│   │   ├── ingest.py           # POST /ingest
│   │   ├── analytics.py        # GET /trends, GET /insights
│   │   └── search.py           # GET /search, GET /analytics/summary
│   ├── services/
│   │   ├── ingestion.py        # News API client + normalization
│   │   ├── processor.py        # Sentiment, keywords, trend score
│   │   ├── analytics.py        # MongoDB aggregation pipelines
│   │   ├── scheduler.py        # Periodic auto-ingestion
│   │   └── validator.py        # Data validation pipeline
│   └── main.py                 # App factory, lifespan, middleware
├── frontend/                   # React Frontend (Vite)
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Analytics dashboard with charts
│   │   │   ├── Search.jsx      # Article search with filters
│   │   │   ├── IngestControl.jsx # Data ingestion controls
│   │   │   ├── Login.jsx       # User login page
│   │   │   └── Signup.jsx      # User registration page
│   │   ├── services/api.js     # Axios API client
│   │   ├── App.jsx             # Routes + sidebar layout
│   │   ├── App.css             # Component styles
│   │   └── index.css           # Design system + variables
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── tests/
│   ├── conftest.py
│   └── test_processor.py       # Unit tests for NLP pipeline
├── .env.example
├── Procfile
├── requirements.txt
└── README.md
```

## Features

### Backend
- **Data Ingestion** — Fetch articles from News API with background processing
- **NLP Pipeline** — Sentiment analysis, keyword extraction, trend scoring
- **MongoDB Atlas** — Async driver with connection retry logic & SSL (certifi)
- **JWT Authentication** — Secure signup/login with bcrypt password hashing
- **Rate Limiting** — Per-route limits using SlowAPI
- **In-Memory Cache** — TTL-based caching for analytics endpoints
- **Data Validation** — Pipeline-style validation & sanitization
- **Scheduled Automation** — Periodic auto-ingestion every 60 minutes
- **Structured Logging** — Configurable log levels with timestamps
- **CORS Middleware** — Full cross-origin support

### Frontend
- **Dashboard** — Real-time analytics with area charts, pie charts, bar charts
- **News Search** — Full-text search with sentiment filtering & pagination
- **Data Ingestion** — UI to trigger ingestion tasks with category selection
- **Authentication** — Login/Signup with JWT token management
- **Modern UI** — Light professional theme with Inter font, animations
- **Responsive** — Mobile-friendly layout with collapsible sidebar

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/huzaifahimad/AI-Powered-Market-Intelligence-Trend-Analytics.git
cd AI-Powered-Market-Intelligence-Trend-Analytics
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
JWT_SECRET_KEY=your_secret_key_here
```

Get your free News API key at: https://newsapi.org/register  
Get free MongoDB Atlas cluster at: https://cloud.mongodb.com

### 3. Run backend

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

### 5. Run tests

```bash
pytest tests/ -v
```

---

## API Documentation

### Authentication

#### POST /auth/signup
Register a new user account.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response (201):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "name": "John Doe", "email": "john@example.com" }
}
```

#### POST /auth/login
Authenticate and receive a JWT token.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

---

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

### `users` collection
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password_hash": "$2b$12$...",
  "created_at": "2026-04-18T09:00:00Z"
}
```

---

## Advanced Features Implemented

| Feature | Description |
|---|---|
| **Background Tasks** | `/ingest` returns immediately; processing runs via `BackgroundTasks` |
| **JWT Authentication** | Secure signup/login with bcrypt + JWT tokens (24h expiry) |
| **Rate Limiting** | Per-route limits (SlowAPI): 10/min for ingest, 30/min for analytics |
| **In-Memory Cache** | TTL-based cache for analytics endpoints (5 min default) |
| **Data Validation** | Pipeline-style validator with sanitization & error collection |
| **Scheduled Automation** | Periodic ingestion every 60 minutes across 5 topic categories |
| **Structured Logging** | Timestamps, log levels, module context — configurable via `LOG_LEVEL` |
| **Connection Retry** | MongoDB connects with 3 retry attempts + exponential backoff |
| **SSL Certificates** | Uses `certifi` for MongoDB Atlas TLS certificate verification |

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

## Evaluation Checklist

| Criteria | Status |
|---|---|
| Data Ingestion from real API | ✅ News API with normalization |
| Raw data stored in MongoDB | ✅ `raw_data` collection, upsert by URL |
| Sentiment analysis | ✅ Rule-based with negation handling |
| Keyword extraction | ✅ Frequency + stopword filtering |
| Trend score | ✅ Recency decay + content richness |
| Time-series analysis | ✅ Daily counts + growth rate in `/insights` |
| POST /ingest | ✅ with background processing |
| GET /trends | ✅ with caching |
| GET /insights | ✅ with caching |
| GET /search | ✅ with pagination + sentiment filter |
| GET /analytics/summary | ✅ with caching |
| Authentication | ✅ JWT signup/login |
| Pydantic models | ✅ All request/response models |
| Pagination | ✅ `/search` endpoint |
| Error handling | ✅ Global handler + per-route |
| Background tasks | ✅ Ingestion runs async |
| Rate limiting | ✅ Per-route via SlowAPI |
| Caching | ✅ In-memory TTL cache |
| Data validation | ✅ Pipeline validator |
| Logging system | ✅ Structured, configurable |
| Scheduled automation | ✅ Periodic ingestion |
| Frontend dashboard | ✅ React + Recharts |
| Modular code | ✅ Separated routers/services/models/core |
| Deployment ready | ✅ Procfile, Dockerfile, env vars |
