import os
import sys

# Ensure backend root is in python search path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import SkillArenaException
from app.database.mongodb import db_manager
from app.cache.redis_client import redis_manager
from app.cache.cache_service import cache_service
from app.api.v1 import api_v1_router
from app.ai.provider import ai_provider


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and cache
    logger.info("Initializing SkillArena AI backend services...")
    await db_manager.connect()
    await redis_manager.connect()
    yield
    # Shutdown: clean up connections
    logger.info("Shutting down SkillArena AI backend services...")
    await db_manager.close()
    await redis_manager.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SkillArena AI - Full Technical Blueprint API: AI Interview Preparation, Adaptive Learning, Bayesian Knowledge Tracing & Gamification.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. CORS Configuration (Section 17: Security)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Rate Limiting & Abuse Prevention Middleware (Section 8 & 17)
@app.middleware("http")
async def rate_limit_and_security_middleware(request: Request, call_next):
    # Skip rate limiting for static docs or health checks
    path = request.url.path
    if path in ("/docs", "/redoc", "/openapi.json", "/health", "/api/v1/health"):
        return await call_next(request)

    # Identify caller via anonymous ID header, bearer token, or IP
    client_id = request.headers.get("x-anonymous-id")
    if not client_id:
        client_id = request.client.host if request.client else "unknown_client"

    allowed, remaining, reset_sec = await cache_service.check_rate_limit(
        identifier=client_id,
        limit=settings.RATE_LIMIT_PER_MINUTE,
        window_sec=60
    )

    if not allowed:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "RATE_LIMIT_EXCEEDED",
                "message": f"Rate limit exceeded. Please wait {reset_sec} seconds before trying again."
            },
            headers={"Retry-After": str(reset_sec)}
        )

    response: Response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_PER_MINUTE)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response


# 3. Global Exception Handler
@app.exception_handler(SkillArenaException)
async def skillarena_exception_handler(request: Request, exc: SkillArenaException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.__class__.__name__, "message": exc.detail}
    )


# 4. Root & Health Endpoints
@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "blueprint_version": "Full Project Plan & Technical Blueprint",
        "docs": "/docs"
    }


@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "database": "connected" if db_manager.is_connected else "in_memory_fallback",
        "cache": "connected" if redis_manager.is_connected else "in_memory_fallback",
        "ai_provider": "configured" if ai_provider.is_configured else "deterministic_fallback_mode"
    }


# 5. Include API v1 Router
app.include_router(api_v1_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
