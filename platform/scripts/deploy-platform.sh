#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/../.." && pwd)
PLATFORM_SOURCE_DIR="$REPO_ROOT/platform"
PLATFORM_ROOT="${PLATFORM_ROOT:-/srv/platform}"
PLATFORM_ENV_FILE="${PLATFORM_ENV_FILE:-$PLATFORM_ROOT/.env}"
DEFAULT_DESIR_REPO_URL="https://github.com/SilverBackDo/DesirSolutions.com.git"

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

prepare_github_known_hosts() {
  local repo_url="$1"

  if [[ "$repo_url" == git@github.com:* ]]; then
    mkdir -p "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"
    touch "$HOME/.ssh/known_hosts"
    ssh-keyscan github.com >>"$HOME/.ssh/known_hosts" 2>/dev/null || true
    chmod 600 "$HOME/.ssh/known_hosts"
  fi
}

sync_checkout() {
  local repo_url="$1"
  local repo_branch="$2"
  local repo_dir="$3"

  prepare_github_known_hosts "$repo_url"
  run install -d -m 0755 "$(dirname "$repo_dir")"

  if [ ! -d "$repo_dir/.git" ]; then
    run git clone --branch "$repo_branch" "$repo_url" "$repo_dir"
    return
  fi

  run git -C "$repo_dir" fetch --all --prune
  run git -C "$repo_dir" checkout "$repo_branch"
  run git -C "$repo_dir" pull --ff-only origin "$repo_branch"
}

detect_public_dir() {
  local repo_dir="$1"
  local explicit_subdir="$2"

  if [ -n "$explicit_subdir" ] && [ -d "$repo_dir/$explicit_subdir" ]; then
    printf '%s\n' "$repo_dir/$explicit_subdir"
    return
  fi

  for candidate in dist build public site; do
    if [ -d "$repo_dir/$candidate" ]; then
      printf '%s\n' "$repo_dir/$candidate"
      return
    fi
  done

  if find "$repo_dir" -maxdepth 1 -type f -name '*.html' | grep -q .; then
    printf '%s\n' "$repo_dir"
    return
  fi

  echo "Unable to detect a publishable static directory in $repo_dir" >&2
  exit 1
}

stage_directory() {
  local source_dir="$1"
  local target_dir="$2"
  local root_static="$3"
  local temp_dir="${target_dir}.tmp"
  local copied_any=0

  run rm -rf "$temp_dir"
  run install -d -m 0755 "$temp_dir"

  if [ "$root_static" = "1" ]; then
    while IFS= read -r file_path; do
      run cp "$file_path" "$temp_dir/"
      copied_any=1
    done < <(find "$source_dir" -maxdepth 1 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name 'robots.txt' -o -name 'sitemap.xml' -o -name 'favicon*' -o -name 'manifest.webmanifest' \))

    for asset_dir in assets css js img images fonts media static; do
      if [ -d "$source_dir/$asset_dir" ]; then
        run cp -R "$source_dir/$asset_dir" "$temp_dir/"
        copied_any=1
      fi
    done
  else
    run cp -R "$source_dir/." "$temp_dir/"
    copied_any=1
  fi

  if [ "$copied_any" != "1" ]; then
    echo "No static files were staged from $source_dir" >&2
    exit 1
  fi

  run rm -rf "$target_dir"
  run mv "$temp_dir" "$target_dir"
}

publish_repo_site() {
  local site_name="$1"
  local repo_url="$2"
  local repo_branch="$3"
  local explicit_subdir="$4"
  local site_root="$5"
  local repo_dir="$site_root/repo"
  local current_dir="$site_root/current"
  local source_dir

  run install -d -m 0755 "$site_root"
  sync_checkout "$repo_url" "$repo_branch" "$repo_dir"
  source_dir=$(detect_public_dir "$repo_dir" "$explicit_subdir")

  if [ "$source_dir" = "$repo_dir" ]; then
    stage_directory "$source_dir" "$current_dir" 1
  else
    stage_directory "$source_dir" "$current_dir" 0
  fi

  echo "Published $site_name from $repo_url"
}

publish_consultant_site() {
  local source_dir="$PLATFORM_SOURCE_DIR/sites/consultant-profile"
  local target_dir="$PLATFORM_ROOT/Alcines/current"

  run install -d -m 0755 "$PLATFORM_ROOT/Alcines"
  stage_directory "$source_dir" "$target_dir" 0
  echo "Published consultant profile site"
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

  DESIRSOLUTIONS_REPO_URL="${DESIRSOLUTIONS_REPO_URL:-$DEFAULT_DESIR_REPO_URL}"
  BELLAHBURGER_REPO_BRANCH="${BELLAHBURGER_REPO_BRANCH:-main}"
  DESIRSOLUTIONS_REPO_BRANCH="${DESIRSOLUTIONS_REPO_BRANCH:-main}"
  BELLAHBURGER_PUBLIC_SUBDIR="${BELLAHBURGER_PUBLIC_SUBDIR:-}"
  DESIRSOLUTIONS_PUBLIC_SUBDIR="${DESIRSOLUTIONS_PUBLIC_SUBDIR:-}"

  require_env \
    LETSENCRYPT_EMAIL \
    TRAEFIK_DASHBOARD_HOST \
    TRAEFIK_DASHBOARD_USERS \
    BELLAHBURGER_DOMAIN \
    BELLAHBURGER_REPO_URL \
    DESIRSOLUTIONS_DOMAIN \
    ALCINES_DOMAIN

  install_runtime_assets
  publish_repo_site "bellahburger" "$BELLAHBURGER_REPO_URL" "$BELLAHBURGER_REPO_BRANCH" "$BELLAHBURGER_PUBLIC_SUBDIR" "$PLATFORM_ROOT/bellahburger"
  publish_repo_site "desirsolutions" "$DESIRSOLUTIONS_REPO_URL" "$DESIRSOLUTIONS_REPO_BRANCH" "$DESIRSOLUTIONS_PUBLIC_SUBDIR" "$PLATFORM_ROOT/desirsolutions"
  publish_consultant_site

  run docker compose --env-file "$PLATFORM_ENV_FILE" -f "$PLATFORM_ROOT/compose.yaml" config > /dev/null
  run docker compose --env-file "$PLATFORM_ENV_FILE" -f "$PLATFORM_ROOT/compose.yaml" up -d --remove-orphans
  run docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
}

main "$@"
