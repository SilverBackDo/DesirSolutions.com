#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/../.." && pwd)
PLATFORM_SOURCE_DIR="$REPO_ROOT/platform"
PLATFORM_ROOT="${PLATFORM_ROOT:-/srv/platform}"
PLATFORM_ENV_FILE="${PLATFORM_ENV_FILE:-$PLATFORM_ROOT/.env}"
DEFAULT_DESIRSOLUTIONS_IMAGE="ghcr.io/silverbackdo/desirsolutions-website:latest"
CURRENT_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-desirsolutions-platform}"

run() {
  if [ "$EUID" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

load_env() {
  if [ ! -f "$PLATFORM_ENV_FILE" ]; then
    echo "Missing environment file: $PLATFORM_ENV_FILE" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  . "$PLATFORM_ENV_FILE"
  set +a
}

require_env() {
  for name in "$@"; do
    if [ -z "${!name:-}" ]; then
      echo "Missing required environment variable: $name" >&2
      exit 1
    fi
  done
}

wait_for_healthy() {
  local container_name="$1"
  local max_attempts="${2:-40}"
  local attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    status=$(run docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || true)
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      echo "$container_name is $status"
      return
    fi

    sleep 3
    attempt=$((attempt + 1))
  done

  echo "Container $container_name did not become healthy." >&2
  run docker logs --tail 100 "$container_name" || true
  exit 1
}

remove_conflicting_container() {
  local container_name="$1"
  local existing_project=""

  if ! run docker inspect "$container_name" >/dev/null 2>&1; then
    return
  fi

  existing_project=$(run docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "$container_name" 2>/dev/null || true)
  if [ "$existing_project" != "$CURRENT_PROJECT_NAME" ]; then
    run docker rm -f "$container_name"
  fi
}

remove_legacy_runtime() {
  for container_name in reverse-proxy desirsolutions-site bellahburger-site alcines-site; do
    remove_conflicting_container "$container_name"
  done
}

install_runtime_assets() {
  run install -d -m 0755 "$PLATFORM_ROOT"
  run install -d -m 0755 "$PLATFORM_ROOT/traefik/acme"
  run install -m 0644 "$PLATFORM_SOURCE_DIR/compose.yaml" "$PLATFORM_ROOT/compose.yaml"

  if [ ! -f "$PLATFORM_ROOT/traefik/acme/acme.json" ]; then
    run touch "$PLATFORM_ROOT/traefik/acme/acme.json"
  fi
  run chmod 600 "$PLATFORM_ROOT/traefik/acme/acme.json"
}

main() {
  load_env

  DESIRSOLUTIONS_IMAGE="${DESIRSOLUTIONS_IMAGE:-$DEFAULT_DESIRSOLUTIONS_IMAGE}"

  require_env \
    LETSENCRYPT_EMAIL \
    DESIRSOLUTIONS_DOMAIN \
    DESIRSOLUTIONS_IMAGE

  install_runtime_assets

  run docker pull "$DESIRSOLUTIONS_IMAGE"
  remove_legacy_runtime
  run docker compose --env-file "$PLATFORM_ENV_FILE" -f "$PLATFORM_ROOT/compose.yaml" config > /dev/null
  run docker compose --env-file "$PLATFORM_ENV_FILE" -f "$PLATFORM_ROOT/compose.yaml" up -d --remove-orphans
  wait_for_healthy "desirsolutions-site" 40
  run docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
}

main "$@"
