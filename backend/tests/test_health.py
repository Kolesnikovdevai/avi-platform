from fastapi.testclient import TestClient

from avitopulse.entrypoints.api import create_app
from avitopulse.shared.config import Settings


def test_live_does_not_claim_database_is_ready() -> None:
    with TestClient(create_app(Settings(database_url=None))) as client:
        assert client.get("/api/health/live").json() == {"status": "ok"}
        response = client.get("/api/health/ready")
        assert response.status_code == 503
        assert response.json() == {"status": "not_ready"}
        assert response.headers["cache-control"] == "no-store"


def test_unavailable_database_is_a_safe_failure() -> None:
    settings = Settings(database_url="postgresql+psycopg://unused:canary@127.0.0.1:1/unused")
    with TestClient(create_app(settings)) as client:
        response = client.get("/api/health/ready")
        assert response.status_code == 503
        assert "canary" not in response.text


def test_no_tenant_endpoints_or_session_bypass() -> None:
    with TestClient(create_app(Settings(database_url=None))) as client:
        response = client.get("/api/organizations/foreign/analytics?token=canary")
        assert response.status_code == 404
        request_id = response.headers["x-request-id"]
        assert len(request_id) == 32
        assert client.get("/api/health/live").headers["x-request-id"] != request_id
