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

CONTAINER="${CONTAINER:-${DB_CONTAINER:-desir-db}}"
DB_USER="${DB_USER:-$(read_env_value DB_USER)}"
DB_USER="${DB_USER:-desiruser}"
PRIMARY_DB_NAME="${PRIMARY_DB_NAME:-$(read_env_value DB_NAME)}"
PRIMARY_DB_NAME="${PRIMARY_DB_NAME:-desir}"
BACKUP_DRILL_DIR="${BACKUP_DRILL_DIR:-$REPO_ROOT/tmp/backup-drill}"
CLEANUP_DRILL_DB="${CLEANUP_DRILL_DB:-true}"
TIMESTAMP="$(date -u +%Y%m%d%H%M%S)"
DRILL_DB_NAME="desir_restore_drill_${TIMESTAMP}"
ALERT_SCRIPT="${SCRIPT_DIR}/send-operational-alert.sh"

handle_drill_error() {
  local exit_code="$1"
  local line_no="$2"
  send_drill_alert "Backup restore drill for scratch database '$DRILL_DB_NAME' failed at line ${line_no}."
  exit "$exit_code"
}

send_drill_alert() {
  local message="$1"
  if [ -x "$ALERT_SCRIPT" ]; then
    ENV_FILE="$ENV_FILE" \
    CATEGORY="backup_restore_drill_failure" \
    SOURCE="backup-restore-drill.sh" \
    "$ALERT_SCRIPT" \
    critical \
    "Backup restore drill failed" \
    "$message"
  fi
}

fail_drill() {
  local message="$1"
  echo "$message" >&2
  send_drill_alert "$message"
  exit 1
}

trap 'handle_drill_error $? $LINENO' ERR

mkdir -p "$BACKUP_DRILL_DIR"

BACKUP_DIR="$BACKUP_DRILL_DIR" KEEP_DAYS=2 "$SCRIPT_DIR/backup-db.sh"
LATEST_BACKUP="$(ls -1t "$BACKUP_DRILL_DIR"/desir_backup_*.sql.gz | head -n 1)"

DROP_TARGET_DB=true CREATE_TARGET_DB=true "$SCRIPT_DIR/restore-db.sh" "$LATEST_BACKUP" "$DRILL_DB_NAME"

CORE_TABLE_COUNT="$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DRILL_DB_NAME" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('clients', 'contact_submissions', 'leads', 'opportunities');")"

if [ "${CORE_TABLE_COUNT:-0}" -lt 4 ]; then
  fail_drill "Restore drill failed: expected core CRM tables were not present in '$DRILL_DB_NAME'."
fi

if [ "$CLEANUP_DRILL_DB" = "true" ]; then
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DRILL_DB_NAME}' AND pid <> pg_backend_pid();" >/dev/null
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
    "DROP DATABASE IF EXISTS \"$DRILL_DB_NAME\";" >/dev/null
fi

echo "Backup/restore drill passed using '$LATEST_BACKUP' into '$DRILL_DB_NAME'."
