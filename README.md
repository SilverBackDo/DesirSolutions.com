### Desir Solutions Self-Hosted Website

This website implements the self-hosted architecture from Asset 22 and content from Asset 19 and Asset 03.

### Pages
- `index.html`
- `services.html`
- `talent.html`
- `about.html`
- `contact.html`
- `terms-privacy.html`

### Local run with Docker
1. From `Desirtech`, run:
   - `docker compose up -d --build`
2. Open:
   - `http://localhost:8080`

### Self-hosted deployment model
- Nginx reverse proxy serves static frontend
- `/api/*` routes to backend service
- GitHub Actions deploys to Oracle VM by SSH
- SSL is expected to be managed at VM Nginx/Certbot layer

### OCI Day-1 bootstrap (new VM)
1. SSH into your Oracle VM.
2. Copy this project to `/opt/desir/Desirtech` (or set your path).
3. Run:
   - `chmod +x scripts/bootstrap-oci-vm.sh`
   - `./scripts/bootstrap-oci-vm.sh`
4. Before running, edit placeholders inside `scripts/bootstrap-oci-vm.sh`:
   - `REPLACE_WITH_YOUR_GIT_REPO_URL`
   - `REPLACE_WITH_DOMAIN`
   - `REPLACE_WITH_SSL_EMAIL`
5. Script supports:
   - Fedora/RHEL-family (`dnf` + `firewalld`)
   - Ubuntu/Debian (`apt` + `ufw`)

### GitHub Actions deploy prerequisites
- Workflow file: `/.github/workflows/deploy.yml`
- Required GitHub Secrets:
  - `OCI_VM_HOST`
  - `OCI_VM_USER`
  - `OCI_VM_SSH_KEY`
- Trigger: Manual (`workflow_dispatch`)
