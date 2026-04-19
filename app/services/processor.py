import re
import math
from collections import Counter
from datetime import datetime, timezone
from typing import Any

# ── Stopwords ─────────────────────────────────────────────────────────────────
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "will", "would", "could", "should", "may", "might",
    "do", "does", "did", "not", "this", "that", "these", "those", "it", "its",
    "he", "she", "they", "we", "you", "i", "me", "him", "her", "us", "them",
    "said", "says", "also", "than", "as", "if", "up", "out", "about", "after",
    "over", "more", "new", "one", "two", "all", "can", "my", "our", "their",
    "what", "which", "who", "when", "where", "how", "no", "so", "get", "just",
    "been", "into", "than", "then", "now", "its", "only", "other", "some",
    "such", "like", "even", "see", "very", "any", "each", "few", "make",
    "well", "ago", "per", "top", "yet",
}

# ── Sentiment lexicons ────────────────────────────────────────────────────────
POSITIVE_WORDS = {
    "growth", "profit", "gain", "rise", "surge", "breakthrough", "innovation",
    "success", "strong", "record", "best", "positive", "improve", "boost",
    "recovery", "advance", "exceed", "win", "lead", "expand", "thrive",
    "revenue", "invest", "deal", "launch", "partnership", "opportunity",
    "upgrade", "rally", "soar", "beat", "outperform", "reward", "prosper",
    "accelerate", "achieve", "efficient", "optimistic", "robust", "stellar",
    "benefit", "confidence", "sustainable", "momentum", "milestone",
}

NEGATIVE_WORDS = {
    "decline", "loss", "fall", "drop", "crash", "fail", "risk", "crisis",
    "cut", "layoff", "debt", "recession", "inflation", "fraud", "breach",
    "lawsuit", "fine", "sanction", "ban", "warning", "concern", "threat",
    "problem", "issue", "miss", "weak", "slowdown", "deficit", "bankruptcy",
    "downgrade", "slump", "plunge", "selloff", "volatile", "uncertainty",
    "default", "shortage", "downturn", "collapse", "turmoil", "penalty",
    "headwind", "disappointing", "underperform", "tariff", "dispute",
}

# ── Negation words that flip sentiment ───────────────────────────────────────
NEGATION_WORDS = {"not", "no", "never", "neither", "nor", "without", "barely",
                  "hardly", "scarcely", "doesn", "isn", "wasn", "haven"}


def extract_keywords(text: str, top_n: int = 10) -> list[str]:
    """Extract meaningful keywords from text using frequency + filtering."""
    if not text or not text.strip():
        return []

    # Tokenize: lowercase, letters only, min length 3
    tokens = re.findall(r"\b[a-z]{3,}\b", text.lower())
    filtered = [t for t in tokens if t not in STOPWORDS and not t.isdigit()]

    if not filtered:
        return []

    counts = Counter(filtered)
    return [word for word, _ in counts.most_common(top_n)]


def analyze_sentiment(text: str) -> tuple[str, float]:
    """
    Rule-based sentiment analysis with simple negation handling.
    Returns (label, score) where score ∈ [-1.0, 1.0].
    """
    if not text or not text.strip():
        return "neutral", 0.0

    tokens = re.findall(r"\b[a-z]{2,}\b", text.lower())

    pos_hits = 0
    neg_hits = 0
    negate = False

    for token in tokens:
        if token in NEGATION_WORDS:
            negate = True
            continue

        if token in POSITIVE_WORDS:
            if negate:
                neg_hits += 1
            else:
                pos_hits += 1
            negate = False
        elif token in NEGATIVE_WORDS:
            if negate:
                pos_hits += 1
            else:
                neg_hits += 1
            negate = False
        else:
            # Reset negation after a non-sentiment word (window = 1)
            negate = False

    total = max(pos_hits + neg_hits, 1)
    raw_score = (pos_hits - neg_hits) / total  # [-1, 1]

    if raw_score > 0.1:
        label = "positive"
    elif raw_score < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return label, round(raw_score, 4)


def compute_trend_score(article: dict[str, Any]) -> int:
    """
    Trend score based on recency and content richness.
    Higher = more trending.
    Score ranges roughly 0–110 (recency 0-100 + richness 0-10).
    """
    now = datetime.now(timezone.utc)
    published = article.get("published_at", now)

    # Ensure timezone-aware
    if isinstance(published, datetime) and published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)

    hours_old = max((now - published).total_seconds() / 3600, 0.1)

    # Recency decay: exponential with 24h half-life
    recency = 100 * math.exp(-0.693 * hours_old / 24)

    # Content richness bonus (title + description + content)
    content_len = (
        len(article.get("content") or "")
        + len(article.get("description") or "")
        + len(article.get("title") or "")
    )
    richness = min(content_len / 200, 10)  # Cap at 10 bonus points

    return max(int(recency + richness), 0)


def process_article(raw: dict[str, Any], raw_id: str) -> dict[str, Any]:
    """Transform a raw article document into a processed document."""
    full_text = " ".join(filter(None, [
        raw.get("title", ""),
        raw.get("description", ""),
        raw.get("content", ""),
    ]))

    sentiment_label, sentiment_score = analyze_sentiment(full_text)
    keywords = extract_keywords(full_text)
    trend_score = compute_trend_score(raw)

    # Relevance/confidence score: normalized [0,1] from sentiment magnitude + keyword density
    keyword_density = min(len(keywords) / 10, 1.0)
    score = round((abs(sentiment_score) * 0.4) + (keyword_density * 0.6), 4)

    return {
        "raw_id": raw_id,
        "title": raw.get("title", ""),
        "sentiment": sentiment_label,
        "sentiment_score": sentiment_score,
        "keywords": keywords,
        "score": score,
        "trend_score": trend_score,
        "category": raw.get("category", "general"),
        "published_at": raw.get("published_at", datetime.now(timezone.utc)),
        "processed_at": datetime.now(timezone.utc),
    }
