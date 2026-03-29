#!/usr/bin/env bash
set -euo pipefail

# Applies canonical SQL schema + reference data + operational views
# into the running desir-db container.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_DIR="${ROOT_DIR}/db/sql"
APP_ENV_FILE="${APP_ENV_FILE:-${ROOT_DIR}/.env}"

if [ -f "${APP_ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1091
  source <(sed 's/\r$//' "${APP_ENV_FILE}")
  set +a
fi

DB_CONTAINER="${DB_CONTAINER:-desir-db}"
DB_USER="${DB_USER:-desiruser}"
DB_NAME="${DB_NAME:-desir}"

for f in 01_full_schema.sql 02_seed_reference_data.sql 03_operational_views.sql; do
  sql_file="${SQL_DIR}/${f}"
  if [ ! -f "${sql_file}" ]; then
    echo "ERROR: Missing SQL file: ${sql_file}" >&2
    exit 1
  fi
  echo "Applying ${f}..."
  cat "${sql_file}" | docker exec -i "${DB_CONTAINER}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}"
done

echo "Schema and views applied successfully."
