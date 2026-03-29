#!/usr/bin/env bash
set -euo pipefail

CRM_AUTOMATION_BASE_URL="${CRM_AUTOMATION_BASE_URL:-https://desirsolutions.com}"
CRM_AUTOMATION_API_KEY="${CRM_AUTOMATION_API_KEY:-}"
CRM_AUTOMATION_LEAD_ID="${CRM_AUTOMATION_LEAD_ID:-}"
CRM_AUTOMATION_CURL_INSECURE="${CRM_AUTOMATION_CURL_INSECURE:-false}"

if [[ -z "$CRM_AUTOMATION_API_KEY" ]]; then
  echo "CRM_AUTOMATION_API_KEY is required" >&2
  exit 1
fi

curl_flags=(-fsS)
if [[ "$CRM_AUTOMATION_CURL_INSECURE" == "true" ]]; then
  curl_flags+=(-k)
fi

base_url="${CRM_AUTOMATION_BASE_URL%/}"

request_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  shift 3 || true
  local args=("${curl_flags[@]}" -X "$method" "$url" -H "Accept: application/json" -H "X-API-Key: $CRM_AUTOMATION_API_KEY")
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" --data "$body")
  fi
  curl "${args[@]}"
}

echo "[crm-smoke] checking health"
request_json GET "$base_url/api/health" >/dev/null
request_json GET "$base_url/api/health/db" >/dev/null

echo "[crm-smoke] listing workflows"
request_json GET "$base_url/api/ai-factory/workflows" >/dev/null

echo "[crm-smoke] listing recent runs"
request_json GET "$base_url/api/ai-factory/runs?limit=5" >/dev/null

if [[ -n "$CRM_AUTOMATION_LEAD_ID" ]]; then
  echo "[crm-smoke] creating lead qualification run for lead $CRM_AUTOMATION_LEAD_ID"
  payload="{\"lead_id\": ${CRM_AUTOMATION_LEAD_ID}}"
  request_json POST "$base_url/api/ai-factory/workflows/lead-qualification/runs" "$payload"
  echo
fi

echo "[crm-smoke] automation surface is responding"
