import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from uuid import uuid4

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy import Engine
from sqlalchemy.exc import SQLAlchemyError

from avitopulse.shared.config import Settings, get_settings
from avitopulse.shared.db import check_database, create_database_engine
from avitopulse.shared.observability import configure_logging

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or get_settings()
    engine: Engine | None = create_database_engine(config)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        if engine is not None:
            engine.dispose()

    app = FastAPI(
        title="AvitoPulse API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )

    @app.middleware("http")
    async def request_context(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = uuid4().hex
        try:
            response = await call_next(request)
        except Exception:
            logger.error("", extra={"event": "request_failed", "request_id": request_id})
            response = JSONResponse({"detail": "Internal server error"}, status_code=500)
        response.headers["X-Request-ID"] = request_id
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        logger.info(
            "",
            extra={
                "event": "request_completed",
                "request_id": request_id,
                "status": response.status_code,
            },
        )
        return response

    @app.get("/api/health/live")
    def live() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/health/ready")
    def ready() -> JSONResponse:
        available = False
        if engine is not None:
            try:
                available = check_database(engine)
            except (SQLAlchemyError, OSError):
                logger.warning("", extra={"event": "dependency_unavailable"})
        return JSONResponse(
            {"status": "ready" if available else "not_ready"},
            status_code=200 if available else 503,
        )

    return app


def main() -> None:
    configure_logging()
    try:
        settings = get_settings()
    except ValidationError:
        logger.error("", extra={"event": "configuration_invalid"})
        raise SystemExit(2) from None
    configure_logging(settings.log_level)
    uvicorn.run(
        create_app(settings), host="127.0.0.1", port=8000, access_log=False, log_config=None
    )
