import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from avitopulse.entrypoints.api import create_app
from avitopulse.shared.config import Settings
from avitopulse.shared.db import check_database, create_database_engine


@pytest.mark.postgres
def test_real_postgres_runtime_privileges_and_baseline() -> None:
    url = os.getenv("AVITOPULSE_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Real PostgreSQL URL not configured; no SQLite substitute")
    engine = create_database_engine(Settings(database_url=url))
    assert engine is not None
    try:
        assert check_database(engine)
        with TestClient(create_app(Settings(database_url=url))) as client:
            response = client.get("/api/health/ready")
            assert response.status_code == 200
            assert response.json() == {"status": "ready"}
        with engine.connect() as connection:
            assert not connection.execute(
                text("SELECT has_schema_privilege(current_user, 'app', 'CREATE')")
            ).scalar_one()
            assert not connection.execute(
                text("SELECT has_schema_privilege(current_user, 'public', 'CREATE')")
            ).scalar_one()
        with engine.connect() as connection, pytest.raises(DBAPIError):
            connection.execute(text("CREATE TABLE app.runtime_must_not_own (id int)"))
    finally:
        engine.dispose()
