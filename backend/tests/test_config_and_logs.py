import logging

import pytest
from pydantic import ValidationError

from avitopulse.shared.config import Settings
from avitopulse.shared.observability import SafeJsonFormatter


def test_configuration_rejects_invalid_url_without_echoing_secret() -> None:
    with pytest.raises(ValidationError) as error:
        Settings(database_url="https://canary-secret.example")
    assert "canary-secret" not in str(error.value)


def test_logs_never_serialize_arbitrary_payloads_or_tracebacks() -> None:
    secret = "canary-private-token"
    record = logging.LogRecord("test", logging.ERROR, "", 0, secret, (), None)
    record.authorization = secret
    record.event = secret
    record.request_id = secret
    record.exc_text = secret
    output = SafeJsonFormatter().format(record)
    assert secret not in output
    assert '"event": "application_event"' in output
