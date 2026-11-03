"""Create application namespace and minimal runtime privileges. No tenant tables yet."""

from alembic import op

revision = "0001_runtime_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA app AUTHORIZATION avitopulse_migrator")
    op.execute("GRANT USAGE ON SCHEMA app TO avitopulse_runtime")
    op.execute("GRANT SELECT ON public.alembic_version TO avitopulse_runtime")
    # Future tenant tables must explicitly grant access only after RLS is installed.


def downgrade() -> None:
    op.execute("REVOKE SELECT ON public.alembic_version FROM avitopulse_runtime")
    op.execute("DROP SCHEMA app")
