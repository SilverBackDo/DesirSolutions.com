#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_cmd=(docker compose)

if [[ -n "${COMPOSE_ENV_FILE:-}" ]]; then
  compose_cmd+=(--env-file "$COMPOSE_ENV_FILE")
fi

if [[ -n "${COMPOSE_PROJECT_NAME_OVERRIDE:-}" ]]; then
  compose_cmd+=(-p "$COMPOSE_PROJECT_NAME_OVERRIDE")
fi

if [[ -n "${COMPOSE_FILE_OVERRIDE:-}" ]]; then
  for compose_file in ${COMPOSE_FILE_OVERRIDE}; do
    compose_cmd+=(-f "$compose_file")
  done
fi

if "${compose_cmd[@]}" ps -q backend >/dev/null 2>&1 && [[ -n "$("${compose_cmd[@]}" ps -q backend)" ]]; then
  "${compose_cmd[@]}" exec -T backend python -m app.eval_lead_qualification "$@"
  "${compose_cmd[@]}" exec -T backend python -m app.eval_provider_qualification_path
  "${compose_cmd[@]}" exec -T backend python -m app.eval_proposal_draft_path
else
  "${compose_cmd[@]}" run --rm backend python -m app.eval_lead_qualification "$@"
  "${compose_cmd[@]}" run --rm backend python -m app.eval_provider_qualification_path
  "${compose_cmd[@]}" run --rm backend python -m app.eval_proposal_draft_path
fi
