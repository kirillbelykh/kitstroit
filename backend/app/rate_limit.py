from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request


class RateLimiter:
    """Small single-process limiter; use Caddy/Redis when running multiple workers."""

    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, request: Request) -> None:
        # ponytail: process-local by design; move to proxy/Redis when horizontal scaling appears.
        forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        key = forwarded or (request.client.host if request.client else "unknown")
        now = monotonic()
        hits = self.hits[key]
        while hits and hits[0] <= now - self.window_seconds:
            hits.popleft()
        if len(hits) >= self.limit:
            retry_after = max(1, int(self.window_seconds - (now - hits[0])))
            raise HTTPException(429, "Too many requests", headers={"Retry-After": str(retry_after)})
        hits.append(now)

    def clear(self) -> None:
        self.hits.clear()


lead_limiter = RateLimiter(5, 60)
login_limiter = RateLimiter(5, 15 * 60)


def limit_leads(request: Request) -> None:
    lead_limiter.check(request)


def limit_logins(request: Request) -> None:
    login_limiter.check(request)
