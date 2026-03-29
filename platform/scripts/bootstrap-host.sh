#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/../.." && pwd)
PLATFORM_SOURCE_DIR="$REPO_ROOT/platform"
PLATFORM_ROOT="${PLATFORM_ROOT:-/srv/platform}"
PLATFORM_ENV_FILE="${PLATFORM_ENV_FILE:-$PLATFORM_ROOT/.env}"
DEFAULT_OPS_USER="${DEFAULT_OPS_USER:-opc}"

run() {
  if [ "$EUID" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

install_packages() {
  if ! command -v dnf >/dev/null 2>&1; then
    echo "This script currently supports Oracle Linux style hosts with dnf." >&2
    exit 1
  fi

  if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1 || ! command -v wget >/dev/null 2>&1 || ! command -v tmux >/dev/null 2>&1; then
    run dnf -y --setopt=install_weak_deps=False --setopt=max_parallel_downloads=1 install git curl wget tmux
  fi

  if ! command -v docker >/dev/null 2>&1; then
    run dnf -y --setopt=install_weak_deps=False --setopt=max_parallel_downloads=1 install docker || true
  fi

  if ! docker compose version >/dev/null 2>&1; then
    run dnf -y --setopt=install_weak_deps=False --setopt=max_parallel_downloads=1 install docker-compose-plugin || true
  fi
}

configure_services() {
  run systemctl enable docker
  run systemctl restart docker

  if id "$DEFAULT_OPS_USER" >/dev/null 2>&1; then
    run usermod -aG docker "$DEFAULT_OPS_USER" || true
  fi

  if command -v firewall-cmd >/dev/null 2>&1; then
    run systemctl enable firewalld
    run systemctl start firewalld
    run firewall-cmd --permanent --add-service=ssh
    run firewall-cmd --permanent --add-service=http
    run firewall-cmd --permanent --add-service=https
    run firewall-cmd --reload
  fi
}

ensure_layout() {
  run install -d -m 0755 "$PLATFORM_ROOT"
  run install -d -m 0755 "$PLATFORM_ROOT/traefik"
  run install -d -m 0755 "$PLATFORM_ROOT/traefik/acme"
  run install -m 0644 "$PLATFORM_SOURCE_DIR/compose.yaml" "$PLATFORM_ROOT/compose.yaml"

  if [ ! -f "$PLATFORM_ROOT/traefik/acme/acme.json" ]; then
    run touch "$PLATFORM_ROOT/traefik/acme/acme.json"
  fi
  run chmod 600 "$PLATFORM_ROOT/traefik/acme/acme.json"
}

write_env_if_missing() {
  if [ -f "$PLATFORM_ENV_FILE" ]; then
    return
  fi

  tmp_env=$(mktemp)
  cat >"$tmp_env" <<EOF
LETSENCRYPT_EMAIL='${LETSENCRYPT_EMAIL:-contact@desirsolutions.com}'
TZ='${TZ:-America/Los_Angeles}'
DESIRSOLUTIONS_DOMAIN='${DESIRSOLUTIONS_DOMAIN:-desirsolutions.com}'
DESIRSOLUTIONS_IMAGE='${DESIRSOLUTIONS_IMAGE:-ghcr.io/silverbackdo/desirsolutions-website:latest}'
EOF
  run install -m 0600 "$tmp_env" "$PLATFORM_ENV_FILE"
  if id "$DEFAULT_OPS_USER" >/dev/null 2>&1; then
    run chown "$DEFAULT_OPS_USER":"$DEFAULT_OPS_USER" "$PLATFORM_ENV_FILE"
  fi
  rm -f "$tmp_env"
}

main() {
  install_packages
  configure_services
  ensure_layout
  write_env_if_missing

  echo "Host bootstrap complete."
  echo "Platform root: $PLATFORM_ROOT"
  echo "Environment file: $PLATFORM_ENV_FILE"
}

main "$@"
