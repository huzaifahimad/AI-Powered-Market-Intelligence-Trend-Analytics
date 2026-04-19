"""Data validation pipeline (Advanced Feature: Data Validation)."""

import re
from datetime import datetime, timezone
from typing import Any
from app.core.logging import logger


class ValidationError(Exception):
    """Raised when data fails validation."""
    def __init__(self, field: str, reason: str):
        self.field = field
        self.reason = reason
        super().__init__(f"Validation failed on '{field}': {reason}")


class DataValidator:
    """
    Pipeline-style validator for raw article data.
    Run all checks and collect errors, or fail fast.
    """

    def __init__(self):
        self.errors: list[ValidationError] = []

    def validate_raw_article(self, article: dict[str, Any]) -> dict[str, Any]:
        """
        Validate and sanitize a raw article dict.
        Returns cleaned article or raises ValidationError.
        """
        self.errors = []
        cleaned = {}

        # ── Required fields ───────────────────────────────────────────────
        cleaned["title"] = self._validate_title(article.get("title"))
        cleaned["url"] = self._validate_url(article.get("url"))

        # ── Optional fields with defaults ─────────────────────────────────
        cleaned["source"] = self._sanitize_text(
            article.get("source", "Unknown"), max_len=200, default="Unknown"
        )
        cleaned["content"] = self._sanitize_text(
            article.get("content"), max_len=2000, default=""
        )
        cleaned["description"] = self._sanitize_text(
            article.get("description"), max_len=500, default=""
        )
        cleaned["category"] = self._sanitize_text(
            article.get("category", "general"), max_len=50, default="general"
        )
        cleaned["query"] = self._sanitize_text(
            article.get("query", ""), max_len=200, default=""
        )
        cleaned["published_at"] = self._validate_datetime(
            article.get("published_at")
        )
        cleaned["ingested_at"] = datetime.now(timezone.utc)

        if self.errors:
            for err in self.errors:
                logger.warning(f"Validation: {err}")
            raise self.errors[0]

        return cleaned

    def _validate_title(self, title: Any) -> str:
        """Title must be non-empty string, not '[Removed]'."""
        if not title or not isinstance(title, str):
            self.errors.append(ValidationError("title", "Missing or empty"))
            return ""
        title = title.strip()
        if title == "[Removed]":
            self.errors.append(ValidationError("title", "Article was removed"))
            return ""
        if len(title) > 500:
            title = title[:500]
        return title

    def _validate_url(self, url: Any) -> str:
        """URL must be a valid http/https URL."""
        if not url or not isinstance(url, str):
            self.errors.append(ValidationError("url", "Missing or empty"))
            return ""
        url = url.strip()
        if not re.match(r"^https?://", url):
            self.errors.append(ValidationError("url", f"Invalid URL format: {url[:100]}"))
            return ""
        if len(url) > 2000:
            self.errors.append(ValidationError("url", "URL exceeds 2000 characters"))
            return ""
        return url

    def _sanitize_text(
        self, text: Any, max_len: int = 2000, default: str = ""
    ) -> str:
        """Sanitize text: strip, truncate, replace nulls."""
        if not text or not isinstance(text, str):
            return default
        text = text.strip()
        # Remove null bytes and control characters (except newlines)
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
        if len(text) > max_len:
            text = text[:max_len]
        return text

    def _validate_datetime(self, dt: Any) -> datetime:
        """Ensure datetime is valid and timezone-aware."""
        if dt is None:
            return datetime.now(timezone.utc)
        if isinstance(dt, datetime):
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        if isinstance(dt, str):
            try:
                parsed = datetime.fromisoformat(dt.replace("Z", "+00:00"))
                return parsed
            except ValueError:
                return datetime.now(timezone.utc)
        return datetime.now(timezone.utc)


# Singleton
validator = DataValidator()
