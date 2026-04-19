import pytest
from datetime import datetime, timezone, timedelta

from app.services.processor import (
    extract_keywords,
    analyze_sentiment,
    compute_trend_score,
    process_article,
)


# ── Keyword extraction tests ─────────────────────────────────────────────────

def test_extract_keywords_basic():
    text = "Artificial intelligence and machine learning are transforming technology industry globally"
    keywords = extract_keywords(text, top_n=5)
    assert isinstance(keywords, list)
    assert len(keywords) <= 5
    assert all(len(k) >= 3 for k in keywords)


def test_extract_keywords_empty():
    assert extract_keywords("") == []
    assert extract_keywords("   ") == []


def test_extract_keywords_no_stopwords():
    """Keywords should not contain common stopwords."""
    text = "The company is building a strong growth platform for the market"
    keywords = extract_keywords(text, top_n=10)
    stopwords = {"the", "is", "for"}
    for kw in keywords:
        assert kw not in stopwords


def test_extract_keywords_deduplication():
    """Repeated words should appear only once."""
    text = "growth growth growth revenue revenue profit"
    keywords = extract_keywords(text, top_n=10)
    assert len(keywords) == len(set(keywords))


# ── Sentiment analysis tests ─────────────────────────────────────────────────

def test_sentiment_positive():
    text = "Strong revenue growth and record profit exceed expectations with innovation breakthrough"
    label, score = analyze_sentiment(text)
    assert label == "positive"
    assert score > 0


def test_sentiment_negative():
    text = "Company faces massive loss layoff crisis bankruptcy debt recession decline"
    label, score = analyze_sentiment(text)
    assert label == "negative"
    assert score < 0


def test_sentiment_neutral():
    label, score = analyze_sentiment("The company released a quarterly report today")
    assert label == "neutral"
    assert -0.1 <= score <= 0.1


def test_sentiment_empty():
    label, score = analyze_sentiment("")
    assert label == "neutral"
    assert score == 0.0


def test_sentiment_negation():
    """'not' + positive word should flip to negative direction."""
    label_pos, score_pos = analyze_sentiment("This is a strong growth story")
    label_neg, score_neg = analyze_sentiment("This is not a strong growth story")
    # Negated positive should be less positive or negative
    assert score_neg < score_pos


# ── Trend score tests ────────────────────────────────────────────────────────

def test_trend_score_recent():
    article = {
        "published_at": datetime.now(timezone.utc),
        "content": "Some content here that is reasonably long to test richness bonus",
    }
    score = compute_trend_score(article)
    assert score > 50  # Recent articles should score high


def test_trend_score_old():
    article = {
        "published_at": datetime.now(timezone.utc) - timedelta(days=10),
        "content": "",
    }
    score = compute_trend_score(article)
    assert score < 5  # 10-day-old article should score very low


def test_trend_score_always_non_negative():
    article = {
        "published_at": datetime.now(timezone.utc) - timedelta(days=365),
        "content": "",
    }
    score = compute_trend_score(article)
    assert score >= 0


def test_trend_score_richness_bonus():
    """Longer content should produce a higher score than empty content."""
    base = {"published_at": datetime.now(timezone.utc)}
    score_empty = compute_trend_score({**base, "content": ""})
    score_rich = compute_trend_score({**base, "content": "a" * 2000})
    assert score_rich > score_empty


# ── Full pipeline test ────────────────────────────────────────────────────────

def test_process_article_structure():
    raw = {
        "title": "AI startup raises record funding amid tech growth",
        "description": "A major breakthrough in machine learning leads to innovation",
        "content": "The artificial intelligence company expanded its revenue and profit",
        "published_at": datetime.now(timezone.utc),
        "category": "technology",
    }
    result = process_article(raw, raw_id="test123")

    # Required fields present
    assert result["raw_id"] == "test123"
    assert result["title"] == raw["title"]
    assert result["category"] == "technology"

    # Sentiment valid
    assert result["sentiment"] in ("positive", "negative", "neutral")
    assert -1.0 <= result["sentiment_score"] <= 1.0

    # Score valid
    assert 0.0 <= result["score"] <= 1.0

    # Trend score non-negative
    assert result["trend_score"] >= 0

    # Keywords list
    assert isinstance(result["keywords"], list)
    assert len(result["keywords"]) > 0

    # Timestamps
    assert "processed_at" in result
    assert "published_at" in result


def test_process_article_minimal():
    """Process article with minimal data (missing optional fields)."""
    raw = {
        "title": "Brief update",
        "published_at": datetime.now(timezone.utc),
    }
    result = process_article(raw, raw_id="minimal_001")
    assert result["raw_id"] == "minimal_001"
    assert result["sentiment"] in ("positive", "negative", "neutral")
    assert isinstance(result["keywords"], list)
