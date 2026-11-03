from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, PostgresDsn, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AVITOPULSE_", env_file=".env", extra="ignore", hide_input_in_errors=True
    )

    environment: Literal["development", "test"] = "development"
    database_url: SecretStr | None = None
    db_timeout_seconds: int = Field(default=3, ge=1, le=10)
    log_level: Literal["INFO", "WARNING", "ERROR"] = "INFO"

    @model_validator(mode="after")
    def validate_database(self) -> Self:
        if self.database_url is not None:
            # Never include the URL or nested parser errors in a validation error.
            raw = self.database_url.get_secret_value()
            try:
                parsed = PostgresDsn(raw)
                if parsed.scheme != "postgresql+psycopg":
                    raise ValueError
            except ValueError:
                raise ValueError("database_url must use postgresql+psycopg") from None
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
