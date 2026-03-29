#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STACK_ENV_FILE="${STACK_ENV_FILE:-.env}"
STACK_COMPOSE_FILES="${STACK_COMPOSE_FILES:-docker-compose.yml}"
STACK_DB_CONTAINER="${STACK_DB_CONTAINER:-desir-db}"
STACK_PROJECT_NAME="${STACK_PROJECT_NAME:-}"
STACK_TLS_DOMAIN="${STACK_TLS_DOMAIN:-}"
STACK_CERTBOT_ROOT="${STACK_CERTBOT_ROOT:-certbot/conf}"
STACK_ACME_WEBROOT="${STACK_ACME_WEBROOT:-certbot/www}"
STACK_TELEMETRY_DIR="${STACK_TELEMETRY_DIR:-telemetry/output}"
STACK_HEALTH_ATTEMPTS="${STACK_HEALTH_ATTEMPTS:-20}"
STACK_HEALTH_SLEEP_SECONDS="${STACK_HEALTH_SLEEP_SECONDS:-5}"
STACK_RUN_COST_BACKFILL="${STACK_RUN_COST_BACKFILL:-true}"
STACK_RUN_EVALS="${STACK_RUN_EVALS:-false}"
STACK_RUN_READINESS="${STACK_RUN_READINESS:-false}"
STACK_READINESS_DECISION="${STACK_READINESS_DECISION:-reject}"
STACK_READINESS_PUBLIC_BASE_URL="${STACK_READINESS_PUBLIC_BASE_URL:-https://127.0.0.1}"
STACK_READINESS_BACKEND_BASE_URL="${STACK_READINESS_BACKEND_BASE_URL:-http://127.0.0.1:8000}"
STACK_CURL_INSECURE="${STACK_CURL_INSECURE:-true}"
STACK_DOCKER_IMAGE_PRUNE="${STACK_DOCKER_IMAGE_PRUNE:-false}"

log() {
  printf '[deploy-stack] %s\n' "$*"
}

resolve_openssl() {
  if command -v openssl >/dev/null 2>&1; then
    command -v openssl
    return
  fi
  if [[ -f "/mnt/c/Program Files/Git/usr/bin/openssl.exe" ]]; then
    printf '%s\n' "/mnt/c/Program Files/Git/usr/bin/openssl.exe"
    return
  fi
  return 1
}

abs_path() {
  local path_value="$1"
  if [[ "$path_value" = /* ]]; then
    printf '%s\n' "$path_value"
  else
    printf '%s/%s\n' "$ROOT_DIR" "$path_value"
  fi
}

ENV_FILE_PATH="$(abs_path "$STACK_ENV_FILE")"

materialize_env_file() {
  if [[ -n "${STACK_ENV_B64:-}" ]]; then
    mkdir -p "$(dirname "$ENV_FILE_PATH")"
    printf '%s' "$STACK_ENV_B64" | base64 --decode | sed 's/\r$//' > "$ENV_FILE_PATH"
    chmod 600 "$ENV_FILE_PATH"
    log "Wrote environment file $STACK_ENV_FILE"
  fi

  if [[ ! -f "$ENV_FILE_PATH" ]]; then
    echo "Environment file not found: $ENV_FILE_PATH" >&2
    exit 1
  fi
}

ensure_paths() {
  mkdir -p "$(abs_path "$STACK_CERTBOT_ROOT")"
  mkdir -p "$(abs_path "$STACK_ACME_WEBROOT")"
  mkdir -p "$(abs_path "$STACK_TELEMETRY_DIR")"
}

ensure_tls_placeholder() {
  if [[ -z "$STACK_TLS_DOMAIN" ]]; then
    return
  fi

  local cert_dir
  cert_dir="$(abs_path "$STACK_CERTBOT_ROOT")/live/$STACK_TLS_DOMAIN"
  local fullchain_path="$cert_dir/fullchain.pem"
  local privkey_path="$cert_dir/privkey.pem"
  local openssl_cmd
  local openssl_keyout="$privkey_path"
  local openssl_out="$fullchain_path"

  openssl_cmd="$(resolve_openssl)" || {
    echo "openssl is required to create the temporary TLS certificate for $STACK_TLS_DOMAIN" >&2
    exit 1
  }

  if [[ -f "$fullchain_path" && -f "$privkey_path" ]]; then
    return
  fi

  mkdir -p "$cert_dir"
  if [[ "$openssl_cmd" == *.exe ]]; then
    openssl_keyout="$(wslpath -w "$privkey_path")"
    openssl_out="$(wslpath -w "$fullchain_path")"
  fi
  "$openssl_cmd" req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$openssl_keyout" \
    -out "$openssl_out" \
    -subj "/CN=${STACK_TLS_DOMAIN}" >/dev/null 2>&1
  log "Created temporary TLS certificate for $STACK_TLS_DOMAIN"
}

compose_cmd=(docker compose --env-file "$ENV_FILE_PATH")
if [[ -n "$STACK_PROJECT_NAME" ]]; then
  compose_cmd+=(-p "$STACK_PROJECT_NAME")
fi
for compose_file in $STACK_COMPOSE_FILES; do
  compose_cmd+=(-f "$compose_file")
done

show_diagnostics() {
  "${compose_cmd[@]}" ps || true
  "${compose_cmd[@]}" logs --tail=100 frontend backend ai-worker otel-collector redis db || true
}

wait_for_db_container() {
  for attempt in $(seq 1 "$STACK_HEALTH_ATTEMPTS"); do
    local status=""
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$STACK_DB_CONTAINER" 2>/dev/null || true)"
    if [[ "$status" == "healthy" || "$status" == "running" ]]; then
      log "Database container $STACK_DB_CONTAINER is $status"
      return
    fi
    if [[ "$attempt" -eq "$STACK_HEALTH_ATTEMPTS" ]]; then
      show_diagnostics
      echo "Database container $STACK_DB_CONTAINER did not become healthy." >&2
      exit 1
    fi
    sleep "$STACK_HEALTH_SLEEP_SECONDS"
  done
}

wait_for_health() {
  local curl_flags=(-fsS)
  if [[ "$STACK_CURL_INSECURE" == "true" ]]; then
    curl_flags+=(-k)
  fi

  for attempt in $(seq 1 "$STACK_HEALTH_ATTEMPTS"); do
    if curl "${curl_flags[@]}" "$STACK_READINESS_BACKEND_BASE_URL/health" >/dev/null \
      && curl "${curl_flags[@]}" "$STACK_READINESS_BACKEND_BASE_URL/health/db" >/dev/null \
      && curl "${curl_flags[@]}" "$STACK_READINESS_PUBLIC_BASE_URL/api/health" >/dev/null \
      && curl "${curl_flags[@]}" "$STACK_READINESS_PUBLIC_BASE_URL/api/health/db" >/dev/null; then
      log "Health checks passed"
      return
    fi

    if [[ "$attempt" -eq "$STACK_HEALTH_ATTEMPTS" ]]; then
      show_diagnostics
      echo "Deployment health checks failed." >&2
      exit 1
    fi
    sleep "$STACK_HEALTH_SLEEP_SECONDS"
  done
}

run_schema() {
  APP_ENV_FILE="$ENV_FILE_PATH" DB_CONTAINER="$STACK_DB_CONTAINER" \
    bash "$ROOT_DIR/scripts/apply-db-schema.sh"
}

run_evals() {
  if [[ "$STACK_RUN_EVALS" != "true" ]]; then
    return
  fi

  COMPOSE_ENV_FILE="$ENV_FILE_PATH" \
  COMPOSE_PROJECT_NAME_OVERRIDE="$STACK_PROJECT_NAME" \
  COMPOSE_FILE_OVERRIDE="$STACK_COMPOSE_FILES" \
    bash "$ROOT_DIR/scripts/run-lead-qualification-evals.sh"
}

run_cost_backfill() {
  if [[ "$STACK_RUN_COST_BACKFILL" != "true" ]]; then
    return
  fi

  COMPOSE_ENV_FILE="$ENV_FILE_PATH" \
  COMPOSE_PROJECT_NAME_OVERRIDE="$STACK_PROJECT_NAME" \
  COMPOSE_FILE_OVERRIDE="$STACK_COMPOSE_FILES" \
    bash "$ROOT_DIR/scripts/backfill-ai-costs.sh"
}

run_readiness() {
  if [[ "$STACK_RUN_READINESS" != "true" ]]; then
    return
  fi

  READINESS_PUBLIC_BASE_URL="$STACK_READINESS_PUBLIC_BASE_URL" \
  READINESS_BACKEND_BASE_URL="$STACK_READINESS_BACKEND_BASE_URL" \
  READINESS_CURL_INSECURE="$STACK_CURL_INSECURE" \
  READINESS_APPROVAL_DECISION="$STACK_READINESS_DECISION" \
    bash "$ROOT_DIR/scripts/launch-readiness.sh" "$ENV_FILE_PATH"
}

materialize_env_file
ensure_paths
ensure_tls_placeholder

log "Deploying base services"
"${compose_cmd[@]}" up -d --build db redis otel-collector certbot frontend crm-frontend

log "Waiting for database health"
wait_for_db_container

log "Deploying dependent services"
"${compose_cmd[@]}" up -d --build backend ai-worker pgadmin --remove-orphans

log "Applying schema"
run_schema

log "Waiting for health"
wait_for_health

if [[ "$STACK_RUN_COST_BACKFILL" == "true" ]]; then
  log "Backfilling historical AI costs"
  run_cost_backfill
fi

if [[ "$STACK_RUN_EVALS" == "true" ]]; then
  log "Running deterministic evals"
  run_evals
fi

if [[ "$STACK_RUN_READINESS" == "true" ]]; then
  log "Running launch readiness gate"
  run_readiness
fi

if [[ "$STACK_DOCKER_IMAGE_PRUNE" == "true" ]]; then
  docker image prune -f
fi

log "Deployment completed"
