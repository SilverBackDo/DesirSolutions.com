# Copilot Instructions for DesirSolutions.com

## Project shape (read this first)

- This repo has **two related apps** under `Desirtech/`:
  1. Static marketing site served by Nginx (`index.html`, `services*.html`, `contact.html`, etc.)
  2. CRM app in `Desirtech/crm-project-Desir-Tech/` (FastAPI backend + React frontend + Postgres)
- Production entrypoint is Docker Compose at `Desirtech/docker-compose.yml` (services: `frontend`, `backend`, `db`, `certbot`).
- Nginx is both static host and reverse proxy: `/api/` -> `backend:8000` (see `Desirtech/nginx/default.conf`).

## Critical architecture contracts

- Keep backend API paths under `/api/...` so Nginx forwarding continues to work.
- `contact.html` submits directly to `/api/contact` (HTML form action, not JS fetch); preserve this endpoint contract.
- Database is internal-only on Docker network (`desir-net` / `crm_network`), not publicly exposed.
- FastAPI app wiring is in `crm-project-Desir-Tech/backend/app/main.py`:
  - routers: `/api/clients`, `/api/contact`, health router
  - global exception handler and CORS setup
  - table creation currently uses `Base.metadata.create_all(bind=engine)` on startup.

## Environment and configuration patterns

- Root deployment stack reads env from `Desirtech/.env` (template: `Desirtech/.env.example`).
- CRM local stack uses `crm-project-Desir-Tech/backend/.env` (template: `backend/.env.example`).
- Required secrets include `DB_PASSWORD` and `SECRET_KEY`; do not hardcode them.
- CORS origins are comma-separated in `ALLOWED_ORIGINS` and parsed in `app/config.py`.

## Developer workflows

- Main local run (full self-hosted stack):
  - `cd Desirtech`
  - `docker compose up -d --build`
- Check health/logs:
  - `docker compose ps`
  - `docker compose logs -f frontend backend db`
- CRM local-only run (nested project):
  - `cd Desirtech/crm-project-Desir-Tech`
  - `docker-compose up -d`
- Deploy is manual GitHub Action (`Desirtech/.github/workflows/deploy.yml`, `workflow_dispatch`) and SSHes into `/opt/desir/Desirtech`.

## Change guidance for AI agents

- Prefer minimal edits that preserve existing container names, service names, and route prefixes.
- If changing API routes/schemas, update both FastAPI router definitions and any HTML/React callers.
- When editing Nginx, preserve security headers, rate-limits, and ACME challenge path.
- Do not introduce new infra tools (k8s/terraform/etc.) unless explicitly requested; current ops model is Docker Compose + OCI VM bootstrap script (`scripts/bootstrap-oci-vm.sh`).
- For deploy-related updates, verify consistency across: `docker-compose.yml`, `nginx/default.conf`, `.env.example`, and `DEPLOYMENT-GUIDE.md`.
