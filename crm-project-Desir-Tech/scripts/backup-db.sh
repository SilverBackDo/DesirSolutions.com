#!/usr/bin/env bash
set -euo pipefail

# ─── Daily PostgreSQL Backup Script ───
# Place on Oracle VM at: ~/scripts/backup-db.sh
# Make executable: chmod +x ~/scripts/backup-db.sh
# Add to crontab:  crontab -e
#   0 2 * * * /home/opc/scripts/backup-db.sh >> /home/opc/backups/backup.log 2>&1

BACKUP_DIR="/home/opc/backups"
CONTAINER="desir-db"
DB_USER="desiruser"
DB_NAME="desir"
TIMESTAMP=$(date +%F_%H%M)
BACKUP_FILE="${BACKUP_DIR}/desir_backup_${TIMESTAMP}.sql"
KEEP_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Verify container is running
if ! docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "[$(date)] ERROR: Container $CONTAINER is not running. Backup aborted."
  exit 1
fi

# Dump database
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Verify dump is not empty
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date)] ERROR: Backup file is empty. Backup aborted."
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Compress
gzip "$BACKUP_FILE"

# Remove backups older than $KEEP_DAYS days
find "$BACKUP_DIR" -name "desir_backup_*.sql.gz" -mtime +"$KEEP_DAYS" -delete

SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "[$(date)] Backup completed: ${BACKUP_FILE}.gz ($SIZE)"
