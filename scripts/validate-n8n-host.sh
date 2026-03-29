#!/usr/bin/env bash
set -euo pipefail

docker --version
docker compose version
docker network inspect platform_edge >/dev/null

echo "Docker runtime and platform_edge network are available."
