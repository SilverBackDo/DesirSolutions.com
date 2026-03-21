# Desirtech

Desirtech is the canonical root for deployment and infrastructure.
This root serves the static website and deploys the CRM backend using one Docker Compose stack.

## Canonical Infrastructure (Root)
- `.github/workflows/deploy.yml`
- `docker-compose.yml`
- `Dockerfile`
- `nginx/default.conf`
- `scripts/bootstrap-oci-vm.sh`
- `scripts/backup-db.sh`
- `scripts/apply-db-schema.sh`

## CRM App Code (Kept)
- `crm-project-Desir-Tech/backend`
- `crm-project-Desir-Tech/frontend`

`crm-project-Desir-Tech` is app code only. Deploy and infra are managed from root `Desirtech`.

## Pages
- `index.html`
- `services.html`
- `services-outsourcing.html`
- `talent.html`
- `industries.html`
- `about.html`
- `contact.html`
- `terms-privacy.html`

## Local Run with Docker
1. From `Desirtech`, copy env template:
   - `cp .env.example .env`
2. Set required values in `.env`:
   - `SECRET_KEY`
   - `DB_PASSWORD`
   - `PGADMIN_DEFAULT_PASSWORD`
   - `CRM_ADMIN_USERNAME`
   - `CRM_ADMIN_PASSWORD`
3. Start stack:
   - `docker compose up -d --build`
4. Apply canonical database schema and views (required once per database):
   - `chmod +x scripts/apply-db-schema.sh`
   - `./scripts/apply-db-schema.sh`
5. Open:
   - `https://localhost` (self-signed certificate on first run)
   - `http://localhost` redirects to HTTPS
6. Optional DB GUI (pgAdmin):
   - `http://localhost:5050`

### CRM Admin Password Generation
Generate a strong shell-safe password:

- `docker compose exec -T backend python -c 'import secrets, string; chars = string.ascii_letters + string.digits + "-_"; print("CRM_ADMIN_PASSWORD=" + "".join(secrets.choice(chars) for _ in range(32)))'`

Then:

- put the value into root `.env` as `CRM_ADMIN_PASSWORD=...`
- restart backend: `docker compose up -d backend`

Note: `CRM_ADMIN_PASSWORD_HASH` exists in config, but current runtime dependency versions may not verify bcrypt hashes reliably. Use `CRM_ADMIN_PASSWORD` until bcrypt/passlib compatibility is pinned.

### Non-SSL Local Profile (No Browser Cert Warning)
Use this for local-only HTTP testing on `localhost`:

- `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build`
- Open `http://localhost`

### Dashboard Guardrail
- Financial dashboard endpoints fail closed with `503` and code `FIN_DASHBOARD_NOT_INITIALIZED` until SQL views are present.
- Required views: `vw_accounts_receivable`, `vw_monthly_cashflow`, `vw_tax_position`.

## Data Access Connection Points
- Public website:
   - `https://www.desirsolutions.com`
- API via reverse proxy:
   - `https://www.desirsolutions.com/api/...`
- Direct backend (local dev):
   - `http://localhost:8000/api/...`
   - `http://localhost:8000/health` (direct liveness)
   - `POST http://localhost:8000/api/auth/login` (CRM user login)
- PostgreSQL direct (internal container network):
   - host: `db`
   - port: `5432`
   - database: `${DB_NAME}`
   - user: `${DB_USER}`
- PostgreSQL GUI (local only):
   - pgAdmin URL: `http://localhost:5050`
   - create a server with host `db`, port `5432`, DB/user from `.env`

## Self-hosted Deployment Model
- Nginx serves static frontend and reverse-proxies `/api/*` to FastAPI
- PostgreSQL stays internal to Docker network
- GitHub Actions deploys to Oracle VM over SSH
- SSL is handled by certbot + nginx in the root stack

## OCI Day-1 Bootstrap (New VM)
1. SSH into Oracle VM and clone to `/opt/desir/Desirtech`.
2. Run:
   - `chmod +x scripts/bootstrap-oci-vm.sh`
   - `REPO_URL=<repo> DOMAIN=desirsolutions.com EMAIL=contact@desirsolutions.com ./scripts/bootstrap-oci-vm.sh`

## OCI Traefik Platform
- Multi-site OCI deployment assets live under `platform/`.
- This bundle provisions or reuses OCI network and compute resources, bootstraps Docker on the VM, and deploys a Traefik reverse proxy plus:
  - `bellahburger.com`
  - `desirsolutions.com`
  - `alcines.com`
- Start with platform/README.md.

## GitHub Actions Deploy Prerequisites
- Workflow file: `/.github/workflows/deploy.yml`
- Required GitHub secrets:
   - `OCI_VM_HOST`
   - `OCI_VM_USER`
   - `OCI_VM_SSH_KEY`
- Trigger: Manual (`workflow_dispatch`)


