"""In-memory cache with TTL for analytics endpoints (Advanced Feature: Caching)."""

import time
from typing import Any
from app.core.logging import logger


class InMemoryCache:
    """Simple in-memory cache with per-key TTL support."""

    def __init__(self):
        self._store: dict[str, dict[str, Any]] = {}

    def get(self, key: str) -> Any | None:
        """Return cached value if it exists and hasn't expired, else None."""
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.time() > entry["expires_at"]:
            del self._store[key]
            logger.debug(f"Cache EXPIRED: {key}")
            return None
        logger.debug(f"Cache HIT: {key}")
        return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Store a value with a TTL (default 5 minutes)."""
        self._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds,
        }
        logger.debug(f"Cache SET: {key} (TTL={ttl_seconds}s)")

    def invalidate(self, pattern: str = "") -> int:
        """Remove all keys matching the pattern (or all keys if empty)."""
        if not pattern:
            count = len(self._store)
            self._store.clear()
            logger.info(f"Cache CLEARED: {count} entries removed")
            return count
        keys_to_delete = [k for k in self._store if pattern in k]
        for k in keys_to_delete:
            del self._store[k]
        logger.info(f"Cache INVALIDATED: {len(keys_to_delete)} entries matching '{pattern}'")
        return len(keys_to_delete)

    @property
    def size(self) -> int:
        return len(self._store)


# Global cache instance
cache = InMemoryCache()
