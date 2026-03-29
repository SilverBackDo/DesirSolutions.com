# DesirTech CRM App Code

This folder now contains CRM application code only.
Infrastructure and deployment are managed from the Desirtech root.

## Canonical Infrastructure Location

- `../docker-compose.yml`
- `../.github/workflows/deploy.yml`
- `../nginx/default.conf`
- `../scripts/bootstrap-oci-vm.sh`
- `../scripts/backup-db.sh`

## App Code Kept Here

- `backend/` (FastAPI)
- `frontend/` (React source)

## AI Factory Workspace

- CRM now includes an **AI Factory** page with a live control plane for launching a supervisor-gated lead qualification workflow.
- Backend blueprint endpoint: `/api/agent-blueprints/consulting-firm?framework=crewai|autogen`.
- Frontend route: `/ai-factory` for the live run queue, provider selection, approvals, agent roster, workflow handoffs, and starter prompts.
- AI Factory control-plane API now includes:
  - `GET /api/ai-factory/workflows`
  - `GET /api/ai-factory/runs`
  - `POST /api/ai-factory/workflows/lead-qualification/runs`
  - `POST /api/ai-factory/runs/{run_id}/approvals/{approval_id}`
- Runtime execution is now queue-backed via Redis and a dedicated `app.worker` process.
- Queue delivery now uses Redis Streams with reclaimable pending messages for safer worker recovery.
- Provider adapters exist for real OpenAI Responses API execution and real Anthropic Messages API execution.
- If a requested provider fails at runtime, the worker now falls back to another configured provider or deterministic scoring and records the attempt history in the run metadata.
- Architecture and autonomy posture live in:
  - `../docs/ai-factory/AI_FACTORY_ARCHITECTURE.md`
  - `../docs/ai-factory/AI_FACTORY_AUTONOMY_VALIDATION.md`

## Local Development Notes

- Root stack runs backend from `./crm-project-Desir-Tech/backend`.
- Root stack serves static marketing pages from repository root and publishes the CRM UI at `/crm/`.
- If you run backend directly, use `backend/.env.example` as your template.
- CRM frontend now uses Vite instead of `react-scripts`.
- Frontend local commands:
  - `npm install`
  - `npm run dev`
  - `npm run build`
- Built CRM assets are mounted into the main stack behind nginx at:
  - `https://localhost/crm/`
  - `https://www.desirsolutions.com/crm/`
- For standalone backend mode, set `CRM_ADMIN_USERNAME` and `CRM_ADMIN_PASSWORD` in `backend/.env`.
- Optional multi-user auth is supported through `CRM_AUTH_USERS` as a JSON array of user records in `backend/.env`.
- CRM UI authenticates via `POST /api/auth/login` and bearer tokens.
- AI Factory approvals require a human bearer token. API keys can launch service workflows but cannot approve CRM write-back.
- Do not embed `X-API-Key` in frontend builds. API key is for automation/service access only.
- Use distinct values for `AUTH_JWT_SECRET` and `AUTOMATION_API_KEY`.
- Provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) must stay server-side only.
- n8n workflow assets for CRM orchestration live at:
  - `../n8n/workflows/crm-contact-notification-lead-qualification.json`
  - `../n8n/workflows/crm-awaiting-approval-digest.json`
  - `../n8n/workflows/crm-proposal-follow-up-digest.json`
- CRM-to-n8n webhook wiring is documented in:
  - `../docs/n8n/CRM-INTEGRATION-SOP.md`

For deployment, use only root docs:

- `../README.md`
- `../DEPLOYMENT-GUIDE.md`
- `../docs/ai-factory/AI_FACTORY_ARCHITECTURE.md`
- `../docs/ai-factory/AI_FACTORY_AUTONOMY_VALIDATION.md`
- `../TRUST_PACKAGE.md`
- `../docs/security/SECURITY_OVERVIEW.md`
- `../docs/security/SUBPROCESSORS.md`

If any generated credentials were previously committed, rotate them immediately and replace them only in local `.env` files or secret stores.
