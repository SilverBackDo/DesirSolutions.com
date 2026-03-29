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

severity_rank() {
  case "$1" in
    info) printf '0' ;;
    low) printf '1' ;;
    medium) printf '2' ;;
    high) printf '3' ;;
    critical) printf '4' ;;
    *) printf '3' ;;
  esac
}

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/}"
  printf '%s' "$value"
}

SEVERITY="${1:-high}"
TITLE="${2:-Operational alert}"
MESSAGE="${3:-An operational alert was triggered.}"
CATEGORY="${CATEGORY:-operations}"
SOURCE="${SOURCE:-scripts}"
HOSTNAME_VALUE="${HOSTNAME_OVERRIDE:-$(hostname)}"
WEBHOOK_URL="${OPERATIONS_ALERT_WEBHOOK_URL:-$(read_env_value OPERATIONS_ALERT_WEBHOOK_URL)}"
MIN_SEVERITY="${OPERATIONS_ALERT_MIN_SEVERITY:-$(read_env_value OPERATIONS_ALERT_MIN_SEVERITY)}"
MIN_SEVERITY="${MIN_SEVERITY:-high}"

if [ -z "$WEBHOOK_URL" ]; then
  exit 0
fi

if [ "$(severity_rank "${SEVERITY,,}")" -lt "$(severity_rank "${MIN_SEVERITY,,}")" ]; then
  exit 0
fi

PAYLOAD="$(cat <<EOF
{
  "text": "[DesirTech][${SEVERITY^^}][${CATEGORY}] $(json_escape "$TITLE"): $(json_escape "$MESSAGE")",
  "severity": "$(json_escape "${SEVERITY,,}")",
  "title": "$(json_escape "$TITLE")",
  "message": "$(json_escape "$MESSAGE")",
  "category": "$(json_escape "$CATEGORY")",
  "source": "$(json_escape "$SOURCE")",
  "host": "$(json_escape "$HOSTNAME_VALUE")"
}
EOF
)"

curl -fsS \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL" >/dev/null
