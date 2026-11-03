import os

from alembic import context
from sqlalchemy import create_engine, text

# No credentials in alembic.ini or exceptions. Migration role is distinct from runtime.
url = os.environ.get("AVITOPULSE_MIGRATION_DATABASE_URL")
if not url:
    raise SystemExit("AVITOPULSE_MIGRATION_DATABASE_URL is required")

engine = create_engine(url, hide_parameters=True, connect_args={"connect_timeout": 5})
try:
    with engine.connect() as connection:
        role = connection.execute(text("SELECT current_user")).scalar_one()
        if role != "avitopulse_migrator":
            raise SystemExit("Migrations require avitopulse_migrator")
        connection.rollback()
        context.configure(connection=connection, target_metadata=None)
        with context.begin_transaction():
            context.run_migrations()
finally:
    engine.dispose()
