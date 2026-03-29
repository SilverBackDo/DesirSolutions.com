#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-${READINESS_ENV_FILE:-$ROOT_DIR/.env}}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "python3 or python is required for JSON parsing" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(sed 's/\r$//' "$ENV_FILE")
  set +a
fi

READINESS_PUBLIC_BASE_URL="${READINESS_PUBLIC_BASE_URL:-https://127.0.0.1}"
READINESS_BACKEND_BASE_URL="${READINESS_BACKEND_BASE_URL:-http://127.0.0.1:8000}"
READINESS_RUN_TIMEOUT_SECONDS="${READINESS_RUN_TIMEOUT_SECONDS:-180}"
READINESS_POLL_INTERVAL_SECONDS="${READINESS_POLL_INTERVAL_SECONDS:-5}"
READINESS_APPROVAL_DECISION="${READINESS_APPROVAL_DECISION:-reject}"
READINESS_VERIFY_API_KEY_APPROVAL_BLOCK="${READINESS_VERIFY_API_KEY_APPROVAL_BLOCK:-true}"
READINESS_ALLOW_PRODUCTION_WRITE="${READINESS_ALLOW_PRODUCTION_WRITE:-false}"
READINESS_PROVIDER="${READINESS_PROVIDER:-}"
READINESS_MODEL="${READINESS_MODEL:-}"
READINESS_CURL_INSECURE="${READINESS_CURL_INSECURE:-}"
READINESS_LEAD_SOURCE="${READINESS_LEAD_SOURCE:-referral}"
READINESS_CONTACT_NAME="${READINESS_CONTACT_NAME:-Jordan Banks}"
READINESS_CONTACT_PHONE="${READINESS_CONTACT_PHONE:-555-0100}"
READINESS_COMPANY_NAME="${READINESS_COMPANY_NAME:-Northstar Manufacturing}"
READINESS_TITLE="${READINESS_TITLE:-VP Operations}"
READINESS_ESTIMATED_DEAL_VALUE="${READINESS_ESTIMATED_DEAL_VALUE:-180000}"
READINESS_NOTES="${READINESS_NOTES:-Referred by an existing client. Needs ERP integration support, revenue operations cleanup, and delivery leadership augmentation before an August rollout.}"

if [[ -z "$READINESS_CURL_INSECURE" ]]; then
  case "$READINESS_PUBLIC_BASE_URL" in
    https://127.0.0.1*|https://localhost*)
      READINESS_CURL_INSECURE="true"
      ;;
    *)
      READINESS_CURL_INSECURE="false"
      ;;
  esac
fi

if [[ "$READINESS_APPROVAL_DECISION" != "approve" && "$READINESS_APPROVAL_DECISION" != "reject" ]]; then
  echo "READINESS_APPROVAL_DECISION must be approve or reject" >&2
  exit 1
fi

runtime_env="${ENV:-${APP_ENV:-}}"
if [[ "${runtime_env,,}" == "production" && "$READINESS_ALLOW_PRODUCTION_WRITE" != "true" ]]; then
  echo "Refusing to run mutating launch readiness against production. Use staging or set READINESS_ALLOW_PRODUCTION_WRITE=true to override." >&2
  exit 1
fi

required_vars=(
  AUTOMATION_API_KEY
  CRM_ADMIN_USERNAME
  CRM_ADMIN_PASSWORD
)

for required_var in "${required_vars[@]}"; do
  if [[ -z "${!required_var:-}" ]]; then
    echo "Missing required variable: $required_var" >&2
    exit 1
  fi
done

curl_flags=(-sS --fail --show-error)
if [[ "$READINESS_CURL_INSECURE" == "true" ]]; then
  curl_flags+=(-k)
fi

log() {
  printf '[readiness] %s\n' "$*"
}

json_query() {
  local expression="$1"
  "$PYTHON_BIN" -c "import json, sys; data=json.load(sys.stdin); value=${expression}; print('' if value is None else value)"
}

json_payload() {
  "$PYTHON_BIN" -c "$1"
}

http_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  shift 3 || true
  local headers=("$@")
  local args=("${curl_flags[@]}" -X "$method" "$url" -H "Content-Type: application/json")
  local header
  for header in "${headers[@]}"; do
    args+=(-H "$header")
  done
  if [[ -n "$body" ]]; then
    args+=(--data "$body")
  fi
  curl "${args[@]}"
}

http_status() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  shift 3 || true
  local headers=("$@")
  local response_file
  response_file="$(mktemp)"
  local args=(-sS -o "$response_file" -w "%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  if [[ "$READINESS_CURL_INSECURE" == "true" ]]; then
    args+=(-k)
  fi
  local header
  for header in "${headers[@]}"; do
    args+=(-H "$header")
  done
  if [[ -n "$body" ]]; then
    args+=(--data "$body")
  fi
  local status
  status="$(curl "${args[@]}")"
  cat "$response_file" >&2
  rm -f "$response_file"
  printf '%s' "$status"
}

log "Checking backend health on $READINESS_BACKEND_BASE_URL"
curl "${curl_flags[@]}" "$READINESS_BACKEND_BASE_URL/health" >/dev/null
curl "${curl_flags[@]}" "$READINESS_BACKEND_BASE_URL/health/db" >/dev/null

log "Checking reverse-proxy health on $READINESS_PUBLIC_BASE_URL"
curl "${curl_flags[@]}" "$READINESS_PUBLIC_BASE_URL/api/health" >/dev/null
curl "${curl_flags[@]}" "$READINESS_PUBLIC_BASE_URL/api/health/db" >/dev/null

login_payload="$(json_payload 'import json, os; print(json.dumps({"username": os.environ["CRM_ADMIN_USERNAME"], "password": os.environ["CRM_ADMIN_PASSWORD"]}))')"
login_response="$(http_json POST "$READINESS_BACKEND_BASE_URL/api/auth/login" "$login_payload")"
access_token="$(printf '%s' "$login_response" | json_query "data.get('access_token', '')")"
if [[ -z "$access_token" ]]; then
  echo "Login succeeded but no access token was returned" >&2
  exit 1
fi

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
lead_payload="$(
  READINESS_TIMESTAMP="$timestamp" \
  READINESS_LEAD_SOURCE="$READINESS_LEAD_SOURCE" \
  READINESS_CONTACT_NAME="$READINESS_CONTACT_NAME" \
  READINESS_CONTACT_EMAIL="${READINESS_CONTACT_EMAIL:-}" \
  READINESS_CONTACT_PHONE="$READINESS_CONTACT_PHONE" \
  READINESS_COMPANY_NAME="$READINESS_COMPANY_NAME" \
  READINESS_TITLE="$READINESS_TITLE" \
  READINESS_ESTIMATED_DEAL_VALUE="$READINESS_ESTIMATED_DEAL_VALUE" \
  READINESS_NOTES="$READINESS_NOTES" \
  json_payload 'import json, os; timestamp=os.environ["READINESS_TIMESTAMP"]; contact_email=os.environ.get("READINESS_CONTACT_EMAIL") or ("jordan.banks+" + timestamp + "@example.com"); print(json.dumps({
    "source": os.environ["READINESS_LEAD_SOURCE"],
    "contact_name": os.environ["READINESS_CONTACT_NAME"],
    "contact_email": contact_email,
    "contact_phone": os.environ["READINESS_CONTACT_PHONE"],
    "company_name": os.environ["READINESS_COMPANY_NAME"],
    "title": os.environ["READINESS_TITLE"],
    "estimated_deal_value": float(os.environ["READINESS_ESTIMATED_DEAL_VALUE"]),
    "notes": os.environ["READINESS_NOTES"]
  }))'
)"
lead_response="$(http_json POST "$READINESS_BACKEND_BASE_URL/api/leads/" "$lead_payload" "X-API-Key: $AUTOMATION_API_KEY")"
lead_id="$(printf '%s' "$lead_response" | json_query "data.get('id', '')")"
if [[ -z "$lead_id" ]]; then
  echo "Lead creation did not return an id" >&2
  exit 1
fi
log "Created readiness lead $lead_id"

run_payload="$(
  READINESS_LEAD_ID="$lead_id" \
  READINESS_PROVIDER_VALUE="$READINESS_PROVIDER" \
  READINESS_MODEL_VALUE="$READINESS_MODEL" \
  json_payload 'import json, os; payload={"lead_id": int(os.environ["READINESS_LEAD_ID"])}; provider=os.environ.get("READINESS_PROVIDER_VALUE") or ""; model=os.environ.get("READINESS_MODEL_VALUE") or ""; 
if provider: payload["preferred_provider"]=provider
if model: payload["preferred_model"]=model
print(json.dumps(payload))'
)"
run_response="$(http_json POST "$READINESS_BACKEND_BASE_URL/api/ai-factory/workflows/lead-qualification/runs" "$run_payload" "X-API-Key: $AUTOMATION_API_KEY")"
run_id="$(printf '%s' "$run_response" | json_query "data.get('id', '')")"
execution_mode="$(printf '%s' "$run_response" | json_query "data.get('execution_mode', '')")"
queue_backend="$(printf '%s' "$run_response" | json_query "(((data.get('output_payload') or {}).get('queue') or {}).get('backend', ''))")"
if [[ -z "$run_id" ]]; then
  echo "Run creation did not return an id" >&2
  exit 1
fi
log "Created readiness run $run_id in $execution_mode mode"

deadline_epoch="$(( $(date +%s) + READINESS_RUN_TIMEOUT_SECONDS ))"
approval_id=""
run_status=""
approval_status=""
run_detail=""

while (( $(date +%s) <= deadline_epoch )); do
  run_detail="$(http_json GET "$READINESS_BACKEND_BASE_URL/api/ai-factory/runs/$run_id" "" "X-API-Key: $AUTOMATION_API_KEY")"
  run_status="$(printf '%s' "$run_detail" | json_query "data.get('status', '')")"
  approval_status="$(printf '%s' "$run_detail" | json_query "data.get('approval_status', '')")"
  approval_id="$(printf '%s' "$run_detail" | json_query "(data.get('approvals') or [{}])[0].get('id', '')")"

  if [[ "$run_status" == "awaiting_approval" && -n "$approval_id" ]]; then
    log "Run $run_id reached awaiting_approval with approval $approval_id"
    break
  fi

  if [[ "$run_status" == "failed" || "$run_status" == "rejected" || "$run_status" == "approved" ]]; then
    echo "Run $run_id entered terminal status $run_status before approval gate" >&2
    printf '%s\n' "$run_detail" >&2
    exit 1
  fi

  sleep "$READINESS_POLL_INTERVAL_SECONDS"
done

if [[ "$run_status" != "awaiting_approval" || -z "$approval_id" ]]; then
  echo "Run $run_id did not reach awaiting_approval within timeout" >&2
  printf '%s\n' "$run_detail" >&2
  exit 1
fi

if [[ "$READINESS_VERIFY_API_KEY_APPROVAL_BLOCK" == "true" ]]; then
  log "Verifying API-key approval is blocked"
  blocked_payload='{"decision":"reject","decision_notes":"automation should not be allowed to approve"}'
  blocked_status="$(http_status POST "$READINESS_BACKEND_BASE_URL/api/ai-factory/runs/$run_id/approvals/$approval_id" "$blocked_payload" "X-API-Key: $AUTOMATION_API_KEY" 2>/dev/null || true)"
  if [[ "$blocked_status" != "401" ]]; then
    echo "Expected API-key approval attempt to return 401, got $blocked_status" >&2
    exit 1
  fi
fi

decision_payload="$(
  READINESS_DECISION="$READINESS_APPROVAL_DECISION" \
  json_payload 'import json, os; print(json.dumps({
    "decision": os.environ["READINESS_DECISION"],
    "decision_notes": "launch-readiness verification"
  }))'
)"
decision_response="$(http_json POST "$READINESS_BACKEND_BASE_URL/api/ai-factory/runs/$run_id/approvals/$approval_id" "$decision_payload" "Authorization: Bearer $access_token")"
final_status="$(printf '%s' "$decision_response" | json_query "data.get('status', '')")"
final_approval_status="$(printf '%s' "$decision_response" | json_query "data.get('approval_status', '')")"
opportunity_id="$(printf '%s' "$decision_response" | json_query "data.get('opportunity_id', '')")"
qualification_score="$(printf '%s' "$decision_response" | json_query "((data.get('output_payload') or {}).get('qualification') or {}).get('score', '')")"

expected_final_status="rejected"
if [[ "$READINESS_APPROVAL_DECISION" == "approve" ]]; then
  expected_final_status="approved"
fi

if [[ "$final_status" != "$expected_final_status" ]]; then
  echo "Expected final run status $expected_final_status, got $final_status" >&2
  printf '%s\n' "$decision_response" >&2
  exit 1
fi

log "Readiness check passed"
printf '%s\n' "lead_id=$lead_id"
printf '%s\n' "run_id=$run_id"
printf '%s\n' "execution_mode=$execution_mode"
printf '%s\n' "queue_backend=$queue_backend"
printf '%s\n' "qualification_score=$qualification_score"
printf '%s\n' "approval_status=$final_approval_status"
printf '%s\n' "final_status=$final_status"
printf '%s\n' "opportunity_id=$opportunity_id"
