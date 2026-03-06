#!/usr/bin/env bash
set -euo pipefail

# Daily PostgreSQL backup for Desirtech stack.
# Example cron:
# 0 2 * * * /home/opc/scripts/backup-db.sh >> /home/opc/backups/backup.log 2>&1

BACKUP_DIR="${BACKUP_DIR:-/home/opc/backups}"
CONTAINER="${CONTAINER:-desir-db}"
DB_USER="${DB_USER:-desiruser}"
DB_NAME="${DB_NAME:-desir}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP="$(date +%F_%H%M)"
BACKUP_FILE="${BACKUP_DIR}/desir_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

if ! docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "[$(date)] ERROR: container $CONTAINER is not running; backup aborted."
  exit 1
fi

docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date)] ERROR: backup file is empty; backup aborted."
  rm -f "$BACKUP_FILE"
  exit 1
fi

gzip "$BACKUP_FILE"
find "$BACKUP_DIR" -name "desir_backup_*.sql.gz" -mtime +"$KEEP_DAYS" -delete

SIZE="$(du -h "${BACKUP_FILE}.gz" | cut -f1)"
echo "[$(date)] Backup completed: ${BACKUP_FILE}.gz (${SIZE})"
