#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

read_env_value() {
  local key="$1"
  local line
  if [ ! -f "$ENV_FILE" ]; then
    return 0
  fi
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [ -n "$line" ]; then
    printf '%s' "${line#*=}" | tr -d '\r'
  fi
}

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
    return 0
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
    return 0
  fi
  echo "No SHA-256 tool found (need sha256sum or shasum)." >&2
  return 1
}

database_exists() {
  local db_name="$1"
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '${db_name}';" | grep -q 1
}

drop_database() {
  local db_name="$1"
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db_name}' AND pid <> pg_backend_pid();" >/dev/null
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
    "DROP DATABASE IF EXISTS \"$db_name\";" >/dev/null
}

create_database() {
  local db_name="$1"
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
    "CREATE DATABASE \"$db_name\";" >/dev/null
}

BACKUP_FILE="${1:-${BACKUP_FILE:-}}"
TARGET_DB="${2:-${RESTORE_TARGET_DB:-}}"
CONTAINER="${CONTAINER:-${DB_CONTAINER:-desir-db}}"
DB_USER="${DB_USER:-$(read_env_value DB_USER)}"
DB_USER="${DB_USER:-desiruser}"
PRIMARY_DB_NAME="${PRIMARY_DB_NAME:-$(read_env_value DB_NAME)}"
PRIMARY_DB_NAME="${PRIMARY_DB_NAME:-desir}"
TARGET_DB="${TARGET_DB:-$PRIMARY_DB_NAME}"
CREATE_TARGET_DB="${CREATE_TARGET_DB:-true}"
DROP_TARGET_DB="${DROP_TARGET_DB:-false}"
ALLOW_RESTORE_TO_PRIMARY="${ALLOW_RESTORE_TO_PRIMARY:-false}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh <backup.sql.gz|backup.sql> [target_db]" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [ "$TARGET_DB" = "$PRIMARY_DB_NAME" ] && [ "$ALLOW_RESTORE_TO_PRIMARY" != "true" ]; then
  echo "Refusing to restore into the primary database '$PRIMARY_DB_NAME' without ALLOW_RESTORE_TO_PRIMARY=true." >&2
  exit 1
fi

if ! docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "Database container $CONTAINER is not running." >&2
  exit 1
fi

if [[ "$BACKUP_FILE" == *.sql.gz ]] && [ -f "${BACKUP_FILE%.sql.gz}.sha256" ]; then
  CHECKSUM_FILE="${BACKUP_FILE%.sql.gz}.sha256"
elif [[ "$BACKUP_FILE" == *.sql ]] && [ -f "${BACKUP_FILE%.sql}.sha256" ]; then
  CHECKSUM_FILE="${BACKUP_FILE%.sql}.sha256"
elif [ -f "${BACKUP_FILE}.sha256" ]; then
  CHECKSUM_FILE="${BACKUP_FILE}.sha256"
else
  CHECKSUM_FILE=""
fi

if [ -n "$CHECKSUM_FILE" ]; then
  EXPECTED_CHECKSUM="$(awk '{print $1}' "$CHECKSUM_FILE")"
  ACTUAL_CHECKSUM="$(sha256_file "$BACKUP_FILE")"
  if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
    echo "Checksum mismatch for $BACKUP_FILE" >&2
    exit 1
  fi
fi

if database_exists "$TARGET_DB" && [ "$DROP_TARGET_DB" = "true" ]; then
  drop_database "$TARGET_DB"
fi

if ! database_exists "$TARGET_DB"; then
  if [ "$CREATE_TARGET_DB" = "true" ]; then
    create_database "$TARGET_DB"
  else
    echo "Target database '$TARGET_DB' does not exist and CREATE_TARGET_DB is false." >&2
    exit 1
  fi
fi

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 >/dev/null
else
  cat "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 >/dev/null
fi

echo "Restore completed into database '$TARGET_DB' from '$BACKUP_FILE'."
