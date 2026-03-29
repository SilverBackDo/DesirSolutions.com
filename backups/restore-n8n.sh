#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /path/to/backup-directory" >&2
  exit 1
fi

BACKUP_DIR="$1"
STACK_ROOT="${STACK_ROOT:-/opt/desir/n8n-stack}"
ENV_FILE="${ENV_FILE:-$STACK_ROOT/config/n8n.env}"

if [ "${RESTORE_CONFIRMED:-no}" != "yes" ]; then
  echo "Set RESTORE_CONFIRMED=yes to proceed with a destructive restore." >&2
  exit 1
fi

if [ ! -f "$BACKUP_DIR/n8n.sql" ] || [ ! -f "$BACKUP_DIR/n8n-home.tgz" ]; then
  echo "Backup directory must contain n8n.sql and n8n-home.tgz" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -f "$BACKUP_DIR/n8n.sql.sha256" ]; then
  sha256sum -c "$BACKUP_DIR/n8n.sql.sha256"
fi

if [ -f "$BACKUP_DIR/n8n-home.tgz.sha256" ]; then
  sha256sum -c "$BACKUP_DIR/n8n-home.tgz.sha256"
fi

if [ -z "${N8N_DATA_PATH:-}" ] || [ "$N8N_DATA_PATH" = "/" ]; then
  echo "Refusing to restore into unsafe N8N_DATA_PATH: '$N8N_DATA_PATH'" >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$STACK_ROOT/docker-compose.yml" stop n8n
docker exec -e PGPASSWORD="$DB_POSTGRESDB_PASSWORD" desir-n8n-postgres psql -v ON_ERROR_STOP=1 -U "$DB_POSTGRESDB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_POSTGRESDB_DATABASE' AND pid <> pg_backend_pid();"
docker exec -e PGPASSWORD="$DB_POSTGRESDB_PASSWORD" desir-n8n-postgres psql -v ON_ERROR_STOP=1 -U "$DB_POSTGRESDB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_POSTGRESDB_DATABASE;"
docker exec -e PGPASSWORD="$DB_POSTGRESDB_PASSWORD" desir-n8n-postgres psql -v ON_ERROR_STOP=1 -U "$DB_POSTGRESDB_USER" -d postgres -c "CREATE DATABASE $DB_POSTGRESDB_DATABASE;"
cat "$BACKUP_DIR/n8n.sql" | docker exec -i -e PGPASSWORD="$DB_POSTGRESDB_PASSWORD" desir-n8n-postgres psql -v ON_ERROR_STOP=1 -U "$DB_POSTGRESDB_USER" -d "$DB_POSTGRESDB_DATABASE"
rm -rf "$N8N_DATA_PATH"/*
tar -xzf "$BACKUP_DIR/n8n-home.tgz" -C "$N8N_DATA_PATH"
docker compose --env-file "$ENV_FILE" -f "$STACK_ROOT/docker-compose.yml" up -d

echo "Restore completed from $BACKUP_DIR"
