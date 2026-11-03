-- Runs only for a fresh LOCAL volume, as the bootstrap superuser.
-- psql variables keep generated credentials out of tracked source.
\getenv runtime_password AVITOPULSE_RUNTIME_PASSWORD
\getenv migrator_password AVITOPULSE_MIGRATOR_PASSWORD
SELECT format('CREATE ROLE avitopulse_migrator LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS', :'migrator_password') \gexec
SELECT format('CREATE ROLE avitopulse_runtime LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS', :'runtime_password') \gexec
REVOKE ALL ON DATABASE avitopulse FROM PUBLIC;
GRANT CONNECT ON DATABASE avitopulse TO avitopulse_migrator, avitopulse_runtime;
GRANT CREATE ON DATABASE avitopulse TO avitopulse_migrator;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO avitopulse_migrator;
GRANT USAGE ON SCHEMA public TO avitopulse_runtime;
