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

## Local Development Notes

- Root stack runs backend from `./crm-project-Desir-Tech/backend`.
- Root stack serves static marketing pages from repository root.
- If you run backend directly, use `backend/.env.example` as your template.
- For standalone backend mode, set `CRM_ADMIN_USERNAME` and `CRM_ADMIN_PASSWORD` in `backend/.env`.
- CRM UI authenticates via `POST /api/auth/login` and bearer tokens.
- Do not embed `X-API-Key` in frontend builds. API key is for automation/service access only.

For deployment, use only root docs:

- `../README.md`
- `../DEPLOYMENT-GUIDE.md`

* Generated CRM admin password: **6j4Po7xI7idzqC82TMmfsWilDHbmc1w3**
