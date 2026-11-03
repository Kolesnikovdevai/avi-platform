from sqlalchemy import Engine, create_engine, text

from avitopulse.shared.config import Settings

BASELINE_REVISION = "0001_runtime_schema"


def create_database_engine(settings: Settings) -> Engine | None:
    if settings.database_url is None:
        return None
    return create_engine(
        settings.database_url.get_secret_value(),
        pool_size=3,
        max_overflow=0,
        pool_timeout=settings.db_timeout_seconds,
        pool_pre_ping=True,
        hide_parameters=True,
        connect_args={
            "connect_timeout": settings.db_timeout_seconds,
            "options": f"-c statement_timeout={settings.db_timeout_seconds * 1000}",
        },
    )


def check_database(engine: Engine) -> bool:
    """Check connectivity, privilege boundary and scaffold migration, not tenant data."""
    with engine.connect() as connection:
        role = connection.execute(
            text("""
            SELECT rolsuper, rolbypassrls,
                   EXISTS (SELECT 1 FROM pg_class c
                           JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE c.relowner = r.oid AND n.nspname IN ('public', 'app')),
                   pg_has_role(current_user, 'avitopulse_migrator', 'MEMBER'),
                   current_user = 'avitopulse_runtime'
            FROM pg_roles r WHERE rolname = current_user
        """)
        ).one()
        if any(role[:4]) or not role[4]:
            return False
        revision = connection.execute(
            text("SELECT version_num FROM public.alembic_version")
        ).scalar_one()
        return bool(revision == BASELINE_REVISION)
