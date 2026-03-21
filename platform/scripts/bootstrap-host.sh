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

  run dnf -y update
  run dnf -y install git curl wget htop tmux docker docker-compose-plugin || run dnf -y install git curl wget htop tmux docker
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
  run install -d -m 0755 "$PLATFORM_ROOT/bellahburger"
  run install -d -m 0755 "$PLATFORM_ROOT/desirsolutions"
  run install -d -m 0755 "$PLATFORM_ROOT/Alcines"
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
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-change-me@example.com}
TRAEFIK_DASHBOARD_HOST=${TRAEFIK_DASHBOARD_HOST:-traefik.alcines.com}
TRAEFIK_DASHBOARD_USERS=${TRAEFIK_DASHBOARD_USERS:-admin:replace_with_htpasswd_hash}
TZ=${TZ:-America/Los_Angeles}
BELLAHBURGER_DOMAIN=${BELLAHBURGER_DOMAIN:-bellahburger.com}
BELLAHBURGER_REPO_URL=${BELLAHBURGER_REPO_URL:-https://github.com/SilverBackDo/bellahburger.git}
BELLAHBURGER_REPO_BRANCH=${BELLAHBURGER_REPO_BRANCH:-main}
BELLAHBURGER_PUBLIC_SUBDIR=${BELLAHBURGER_PUBLIC_SUBDIR:-}
DESIRSOLUTIONS_DOMAIN=${DESIRSOLUTIONS_DOMAIN:-desirsolutions.com}
DESIRSOLUTIONS_REPO_URL=${DESIRSOLUTIONS_REPO_URL:-https://github.com/SilverBackDo/DesirSolutions.com.git}
DESIRSOLUTIONS_REPO_BRANCH=${DESIRSOLUTIONS_REPO_BRANCH:-main}
DESIRSOLUTIONS_PUBLIC_SUBDIR=${DESIRSOLUTIONS_PUBLIC_SUBDIR:-}
ALCINES_DOMAIN=${ALCINES_DOMAIN:-alcines.com}
EOF
  run install -m 0600 "$tmp_env" "$PLATFORM_ENV_FILE"
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
