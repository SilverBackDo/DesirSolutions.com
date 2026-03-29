# n8n Deployment SOP

## Deployment Recommendation

Deploy `n8n` as a dedicated Docker Compose stack on the existing OCI VM, using:

- official `n8n` container
- PostgreSQL on the same host
- existing Traefik reverse proxy and TLS flow
- Ansible for host prep, templating, deployment, and service management
- Terraform only for optional host-level infrastructure changes, not application configuration

This keeps the live OCI investment intact and avoids a second platform pattern.

## Repository Structure

```text
Desirtech/
├── infrastructure/terraform/          # existing OCI resource management; only optional n8n infra changes belong here
├── ansible/                           # new host prep and n8n deployment automation
│   ├── inventory/
│   ├── group_vars/
│   ├── playbooks/
│   └── roles/
├── n8n/                               # source-of-truth compose stack, env template, systemd unit
├── proxy/
│   └── traefik/                       # reverse proxy middleware and route notes
├── scripts/                           # host validation and health checks
├── backups/                           # backup and restore helpers
├── docs/
│   └── n8n/                           # SOP, config notes, validation and hardening guidance
├── n8n/workflows/                     # importable workflow assets for CRM and sales operations
└── .github/workflows/                 # CI validation and self-hosted deployment workflow
```

## Terraform vs Ansible Split

### Terraform

Keep Terraform responsible for:

- OCI VM, subnet, routing, NSGs
- optional block volume attachment if n8n data outgrows boot volume
- optional DNS records if DNS is eventually managed as code

### Ansible

Use Ansible for:

- host prerequisite validation
- package installation
- Docker and compose runtime validation
- directory creation and permissions
- n8n env templating
- compose deployment
- systemd unit installation
- backup script placement

### Do Not Use Terraform For

- n8n application env files
- Docker container lifecycle
- PostgreSQL initialization inside the container
- backup cron wiring
- file permissions or service templating on the host

## Required Dependencies

- Docker with compose plugin
- Python 3 and `docker` SDK for Ansible modules
- Traefik already running on the host
- PostgreSQL container in the n8n stack
- Let’s Encrypt handled by existing Traefik ACME flow
- `community.docker` Ansible collection
- OCI Terraform provider only if changing infrastructure state

## Existing VM Validation Steps

Run these before deployment:

```bash
docker --version
docker compose version
docker network inspect platform_edge
systemctl status docker --no-pager
```

Expected state:

- Docker is installed
- compose plugin is installed
- `platform_edge` exists
- Traefik is already serving `80/443`
- SSH remains restricted to the approved CIDR or OCI Bastion

Current wired production target:

- host: `170.9.21.103`
- ansible user: `opc`
- key file: `C:/Users/DevLion/.ssh/id_ed25519_oracle`
- planned n8n FQDN: `n8n.desirsolutions.com`

## Control Node Reality

This repo now has the correct Ansible inventory and playbooks for the live OCI target, but on this current Windows workstation the native Ansible CLI fails with `WinError 87`.

Use one of these control paths:

1. WSL on this workstation
2. a Linux operator box
3. the `self-hosted` GitHub Actions runner path already defined in `.github/workflows/n8n-validate-deploy.yml`

## Step-By-Step Implementation Order

1. Validate the existing OCI VM.
2. Confirm Docker, compose, and the `platform_edge` network exist.
3. Template the n8n env file with secrets.
4. Prepare PostgreSQL and n8n data directories.
5. Deploy PostgreSQL.
6. Deploy n8n.
7. Attach Traefik labels for `n8n.desirsolutions.com`.
8. Confirm TLS issuance after DNS exists.
9. Validate workflow persistence and webhooks.
10. Enable startup through `desir-n8n.service`.

## Reverse Proxy Model

The live routing model is Docker-label driven through the existing Traefik service in `platform/compose.yaml`.

- active routing configuration lives in `n8n/docker-compose.yml`
- `proxy/traefik/n8n-security.yml` is a parity reference for teams that later enable Traefik file provider middleware

Do not introduce a second public reverse proxy for n8n on this VM.

## n8n Configuration Standards

- `N8N_HOST=n8n.desirsolutions.com`
- `N8N_PROTOCOL=https`
- `WEBHOOK_URL=https://n8n.desirsolutions.com/`
- `N8N_PROXY_HOPS=1`
- `DB_TYPE=postgresdb`
- `N8N_ENCRYPTION_KEY=<strong static secret>`
- `GENERIC_TIMEZONE=America/Los_Angeles`
- `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true`
- `EXECUTIONS_DATA_PRUNE=true`
- `EXECUTIONS_DATA_MAX_AGE=336`
- `EXECUTIONS_DATA_PRUNE_MAX_COUNT=10000`
- `N8N_INVITE_LINKS_EMAIL_ONLY=true` only after SMTP is enabled
- `N8N_MFA_ENABLED=true`
- filesystem binary data mode with persistent `.n8n` volume

Owner bootstrap happens in the n8n UI on first startup.
SMTP is optional for the first deployment pass and can be added later without changing the host model.
Before SMTP is configured, invite-email and password-reset flows should be treated as unavailable.
Keep `N8N_ENCRYPTION_KEY` and `N8N_USER_MANAGEMENT_JWT_SECRET` as separate long-lived secrets.
Set `DESIR_CRM_BASE_URL`, `DESIR_CRM_API_KEY`, and `DESIR_APPROVAL_DIGEST_TO` so imported workflows can talk to the existing CRM backend.

## Security And Operations

- keep `80` and `443` public, `22` allowlisted only
- keep n8n on the existing Traefik edge network; never publish `5678` directly
- store secrets only in root-owned env files or Ansible Vault inputs
- enable TLS through the existing ACME flow
- back up both PostgreSQL and `/home/node/.n8n`
- validate restore on a non-production directory before trusting backups
- rotate owner, SMTP, and API credentials on a schedule
- use `docker logs desir-n8n` and `docker logs desir-n8n-postgres` for first-line troubleshooting

## GitHub Actions Integration

The workflow at `.github/workflows/n8n-validate-deploy.yml` does four things:

1. validates Ansible syntax
2. validates the standalone n8n compose file
3. validates the existing Terraform prod environment
4. supports deployment from a `self-hosted` runner with environment approval

Required GitHub secrets for deploy:

- `N8N_POSTGRES_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `N8N_USER_MANAGEMENT_JWT_SECRET`
- `N8N_LETSENCRYPT_EMAIL`
- `DESIR_CRM_API_KEY`

Optional until SMTP is enabled:

- `N8N_SMTP_HOST`
- `N8N_SMTP_USER`
- `N8N_SMTP_PASSWORD`
- `N8N_SMTP_SENDER`

Owner account creation is interactive on first launch and is not supplied through GitHub Actions secrets.

## Validation Checklist

- `https://n8n.desirsolutions.com/healthz` returns success
- `docker inspect -f '{{.State.Health.Status}}' desir-n8n` is `healthy`
- `docker inspect -f '{{.State.Health.Status}}' desir-n8n-postgres` is `healthy`
- a test workflow persists after `docker compose restart`
- webhook URL is publicly reachable after DNS and TLS are live
- backup directory contains SQL dump, `.n8n` archive, and checksums

## Day 1 Deployment Sequence

```bash
cd /path/to/DesirConsultant/Desir-Business\ Structure/Desirtech
ansible-galaxy collection install -r ansible/requirements.yml
cp ansible/group_vars/n8n_hosts/secrets.production.example.yml ansible/group_vars/n8n_hosts/secrets.yml
ansible-playbook ansible/playbooks/n8n-validate-host.yml -e @ansible/group_vars/n8n_hosts/production.instance.yml -e @ansible/group_vars/n8n_hosts/secrets.yml
ansible-playbook ansible/playbooks/n8n-deploy.yml -e @ansible/group_vars/n8n_hosts/production.instance.yml -e @ansible/group_vars/n8n_hosts/secrets.yml
ssh -i C:/Users/DevLion/.ssh/id_ed25519_oracle opc@170.9.21.103 sudo /opt/desir/n8n-stack/healthcheck-n8n.sh
ssh -i C:/Users/DevLion/.ssh/id_ed25519_oracle opc@170.9.21.103 sudo /opt/desir/n8n-stack/backup-n8n.sh
```

After the stack is up:

1. Open `https://n8n.desirsolutions.com`.
2. Complete the owner account creation in the UI.
3. Enable 2FA for the owner account.
4. If SMTP is enabled, send one password reset test email.
5. Run one restore drill against a non-production path before trusting backup operations.
6. Import the workflow files from `n8n/workflows/`.
7. Set `CONTACT_NOTIFICATION_WEBHOOK_URL` in the CRM backend to the n8n webhook path documented in `docs/n8n/CRM-INTEGRATION-SOP.md`.

## Day 30 Hardening Plan

1. Move n8n data from boot volume to a dedicated OCI block volume if usage grows.
2. Add SMTP and verify password reset flow if it was skipped during the first launch.
3. Add off-host backup sync.
4. Add self-hosted runner or operator-controlled deploy lane for GitHub Actions.
5. Add alerting for failed health checks and backup failures.
