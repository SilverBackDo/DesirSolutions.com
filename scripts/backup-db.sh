#!/usr/bin/env bash
set -euo pipefail

# Daily PostgreSQL backup for Desirtech stack.
# Example cron:
# 0 2 * * * /home/opc/scripts/backup-db.sh >> /home/opc/backups/backup.log 2>&1

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

BACKUP_DIR="${BACKUP_DIR:-$(read_env_value BACKUP_DIR)}"
BACKUP_DIR="${BACKUP_DIR:-/home/opc/backups}"
CONTAINER="${CONTAINER:-${DB_CONTAINER:-desir-db}}"
DB_USER="${DB_USER:-$(read_env_value DB_USER)}"
DB_USER="${DB_USER:-desiruser}"
DB_NAME="${DB_NAME:-$(read_env_value DB_NAME)}"
DB_NAME="${DB_NAME:-desir}"
KEEP_DAYS="${KEEP_DAYS:-${BACKUP_KEEP_DAYS:-$(read_env_value BACKUP_KEEP_DAYS)}}"
KEEP_DAYS="${KEEP_DAYS:-14}"
BACKUP_OFFSITE_SYNC_COMMAND="${BACKUP_OFFSITE_SYNC_COMMAND:-$(read_env_value BACKUP_OFFSITE_SYNC_COMMAND)}"
TIMESTAMP="$(date -u +%F_%H%M%S)"
BACKUP_PREFIX="desir_backup_${TIMESTAMP}"
RAW_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}.sql"
COMPRESSED_BACKUP_FILE="${RAW_BACKUP_FILE}.gz"
CHECKSUM_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}.sha256"
MANIFEST_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}.manifest.json"
CREATED_AT_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
ALERT_SCRIPT="${SCRIPT_DIR}/send-operational-alert.sh"

mkdir -p "$BACKUP_DIR"

TEMP_RAW_BACKUP_FILE="$(mktemp "$BACKUP_DIR/.${BACKUP_PREFIX}.XXXXXX.sql")"
TEMP_COMPRESSED_BACKUP_FILE="${TEMP_RAW_BACKUP_FILE}.gz"

cleanup_temp_files() {
  rm -f "$TEMP_RAW_BACKUP_FILE" "$TEMP_COMPRESSED_BACKUP_FILE"
}

handle_backup_error() {
  local exit_code="$1"
  local line_no="$2"
  send_backup_alert "Backup for database '$DB_NAME' in container '$CONTAINER' failed at line ${line_no}."
  exit "$exit_code"
}

send_backup_alert() {
  local message="$1"
  if [ -x "$ALERT_SCRIPT" ]; then
    ENV_FILE="$ENV_FILE" \
    CATEGORY="backup_failure" \
    SOURCE="backup-db.sh" \
    "$ALERT_SCRIPT" \
    high \
    "Database backup failed" \
    "$message"
  fi
}

fail_backup() {
  local message="$1"
  echo "[$(date -u)] ERROR: ${message}" >&2
  send_backup_alert "$message"
  exit 1
}

trap cleanup_temp_files EXIT
trap 'handle_backup_error $? $LINENO' ERR

if ! docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  fail_backup "container $CONTAINER is not running; backup aborted."
fi

docker exec "$CONTAINER" pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -U "$DB_USER" \
  "$DB_NAME" > "$TEMP_RAW_BACKUP_FILE"

if [ ! -s "$TEMP_RAW_BACKUP_FILE" ]; then
  fail_backup "backup file is empty; backup aborted."
fi

gzip -f "$TEMP_RAW_BACKUP_FILE"
mv "$TEMP_COMPRESSED_BACKUP_FILE" "$COMPRESSED_BACKUP_FILE"
CHECKSUM="$(sha256_file "$COMPRESSED_BACKUP_FILE")"
printf '%s  %s\n' "$CHECKSUM" "$(basename "$COMPRESSED_BACKUP_FILE")" > "$CHECKSUM_FILE"

cat > "$MANIFEST_FILE" <<EOF
{
  "backup_file": "$(basename "$COMPRESSED_BACKUP_FILE")",
  "checksum_file": "$(basename "$CHECKSUM_FILE")",
  "database": "$DB_NAME",
  "db_user": "$DB_USER",
  "container": "$CONTAINER",
  "created_at_utc": "$CREATED_AT_UTC",
  "retention_days": $KEEP_DAYS,
  "offsite_sync_configured": $( [ -n "$BACKUP_OFFSITE_SYNC_COMMAND" ] && printf 'true' || printf 'false' )
}
EOF

if [ -n "$BACKUP_OFFSITE_SYNC_COMMAND" ]; then
  BACKUP_FILE_PATH="$COMPRESSED_BACKUP_FILE" \
  BACKUP_CHECKSUM_PATH="$CHECKSUM_FILE" \
  BACKUP_MANIFEST_PATH="$MANIFEST_FILE" \
  bash -lc "$BACKUP_OFFSITE_SYNC_COMMAND"
fi

find "$BACKUP_DIR" -name "desir_backup_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name "desir_backup_*.sha256" -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name "desir_backup_*.manifest.json" -mtime +"$KEEP_DAYS" -delete

SIZE_BYTES="$(wc -c < "$COMPRESSED_BACKUP_FILE" | tr -d ' ')"
echo "[$(date -u)] Backup completed: ${COMPRESSED_BACKUP_FILE} (${SIZE_BYTES} bytes, sha256=${CHECKSUM})"
