# PostgreSQL Config Notes For n8n

## Day 1 Decision

PostgreSQL runs as a container inside the dedicated n8n stack on the same OCI VM.

This is the simplest production-safe starting point because:

- the OCI VM already exists
- the traffic volume is unknown
- n8n needs a stable relational backend immediately
- it keeps backup and restore local and straightforward

## Operational Notes

- use `postgres:16-alpine`
- mount data at `/opt/desir/n8n-stack/postgres`
- keep the database private on the internal Docker network only
- do not expose `5432` publicly
- use `pg_dump` for logical backups
- back up the `.n8n` directory alongside the database

## Recommended Environment

- `DB_TYPE=postgresdb`
- `DB_POSTGRESDB_HOST=postgres`
- `DB_POSTGRESDB_PORT=5432`
- `DB_POSTGRESDB_DATABASE=n8n`
- `DB_POSTGRESDB_USER=n8n`
- `DB_POSTGRESDB_SCHEMA=public`

## Restore Rule

Never trust the backup until both are restored successfully:

1. PostgreSQL dump
2. `/home/node/.n8n` data archive

The database alone is not enough because encryption and binary-data state also live under `.n8n`.

## Restore Safety

- verify `n8n.sql.sha256` and `n8n-home.tgz.sha256` before restore when checksum files exist
- require an explicit `RESTORE_CONFIRMED=yes` flag before running a destructive restore
- restore to a non-production test path first whenever possible
