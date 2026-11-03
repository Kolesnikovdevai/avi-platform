import json
import logging
import sys
from datetime import UTC, datetime


class SafeJsonFormatter(logging.Formatter):
    """Allowlist log fields. Never serialize arbitrary messages, args or exceptions."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, str | int] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "event": "application_event",
        }
        # Application events are fixed strings, never user/provider input.
        event = getattr(record, "event", None)
        if event in {
            "request_completed",
            "request_failed",
            "dependency_unavailable",
            "process_started",
            "process_stopped",
            "configuration_invalid",
        }:
            payload["event"] = event
        request_id = getattr(record, "request_id", None)
        if isinstance(request_id, str) and len(request_id) == 32 and request_id.isalnum():
            payload["request_id"] = request_id
        status = getattr(record, "status", None)
        if isinstance(status, int):
            payload["status"] = status
        return json.dumps(payload)


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(SafeJsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
    # Uvicorn's URL-bearing access logger must never emit query strings.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy.engine"):
        logger = logging.getLogger(name)
        logger.handlers = []
        logger.propagate = True
