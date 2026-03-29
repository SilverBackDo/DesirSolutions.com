#!/usr/bin/env bash
set -euo pipefail

N8N_URL="${N8N_URL:-https://n8n.desirsolutions.com/healthz}"

curl --fail --silent --show-error --location "$N8N_URL" >/dev/null
docker inspect -f '{{.State.Health.Status}}' desir-n8n | grep -q healthy
docker inspect -f '{{.State.Health.Status}}' desir-n8n-postgres | grep -q healthy

echo "n8n health checks passed"
